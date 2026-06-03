import { isCasinoGamblingSpam } from "./spam-filter.mjs";
import { resolveAuthorDisplayName } from "./author-resolve.mjs";

/** Smaller batches avoid "fetch failed" on slow or unstable connections. */
export const BATCH_SIZE = 40;
const MAX_RETRIES = 5;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatImportError(err) {
  const parts = [err?.message ?? String(err)];
  const cause = err?.cause;
  if (cause) {
    parts.push(
      cause.code ? `[${cause.code}]` : "",
      cause.message ?? String(cause),
    );
  }
  if (err?.details) parts.push(err.details);
  if (err?.hint) parts.push(err.hint);
  return parts.filter(Boolean).join(" ");
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function stripHtml(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolveImageUrl(image) {
  const trimmed = String(image ?? "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim()?.replace(/\/$/, "");
  if (!base) return trimmed;
  return `${base}/${trimmed.replace(/^\//, "")}`;
}

function parseTags(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  return s
    .split(/[|,]/g)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

/** Map CSV/JSON row (any column names) → Supabase articles row. */
export function mapArticleRow(row, index) {
  const title = pickField(row, ["title", "post_title", "headline", "name"]);
  if (!title) return null;

  const slugRaw = pickField(row, ["slug", "post_name", "url_slug", "permalink"]);
  const idCandidate = pickField(row, ["id", "post_id", "wp_id", "legacy_wp_id"]);
  const id =
    slugRaw ||
    (isSlugLike(idCandidate) ? idCandidate : "") ||
    slugify(title) ||
    `article-${index}`;

  const excerpt = pickField(row, ["excerpt", "post_excerpt", "summary"]) || stripHtml(
    pickField(row, ["content", "post_content", "body", "html", "article_content"]),
  );
  const content =
    pickField(row, ["content", "post_content", "body", "html", "article_content"]) ||
    `<p>${excerpt}</p>`;
  const plain = stripHtml(content);
  const words = plain.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));

  const statusRaw = pickField(row, ["status", "post_status"]).toLowerCase();
  const status =
    statusRaw === "draft"
      ? "Draft"
      : statusRaw === "review"
        ? "Review"
        : "Published";

  const wpRaw = pickField(row, ["wp_id", "wpid", "legacy_wp_id", "post_id"]) || idCandidate;
  const legacy_wp_id = parseLegacyWpId(wpRaw, id);

  return {
    id: String(id).trim(),
    title,
    excerpt,
    content,
    category: formatCategory(
      pickField(row, ["category", "categories", "post_category", "section"]) || "News",
    ),
    author: resolveAuthorDisplayName(
      pickField(row, ["author", "post_author", "byline", "writer"]) || "Palawan Daily News",
    ),
    tags: parseTags(pickField(row, ["tags", "tag", "post_tag", "post_tags"])),
    date:
      pickField(row, ["date", "post_date", "published", "published_at", "publish_date"]) ||
      new Date().toISOString(),
    reading_time:
      pickField(row, ["reading_time", "readingtime"]) || `${mins} min read`,
    image_url: resolveImageUrl(
      pickField(row, [
        "image",
        "image_url",
        "featured_image",
        "featured_image_url",
        "thumbnail",
        "imageurl",
      ]),
    ),
    is_breaking: parseBool(pickField(row, ["is_breaking", "isbreaking", "breaking"])),
    status,
    legacy_wp_id,
    cms_origin: false,
    updated_at: new Date().toISOString(),
  };
}

function normalizeKey(key) {
  return String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/** Build a lookup from normalized CSV headers → value. */
export function normalizeRecord(record) {
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    out[normalizeKey(key)] = value;
  }
  return out;
}

function pickField(row, keys) {
  const r = row._normalized ?? row;
  for (const key of keys) {
    const v = r[normalizeKey(key)] ?? r[key];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function isSlugLike(value) {
  const s = String(value ?? "").trim();
  if (!s) return false;
  if (/^\d+$/.test(s)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(s) || s.includes("-");
}

function parseLegacyWpId(wpRaw, slugId) {
  const n = Number(wpRaw);
  if (Number.isFinite(n) && n > 0) return n;
  const fromSlug = Number(slugId);
  if (Number.isFinite(fromSlug) && fromSlug > 0 && String(slugId) === String(fromSlug)) {
    return fromSlug;
  }
  return null;
}

function parseBool(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function formatCategory(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "News";

  const segments = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  let pick = segments[segments.length - 1] ?? trimmed;

  if (pick.includes(">")) {
    const parts = pick.split(">").map((s) => s.trim()).filter(Boolean);
    pick = parts[parts.length - 1] ?? pick;
  }

  return pick;
}

function articleRowScore(article) {
  let score = 0;
  if (article.status === "Published") score += 4;
  if (article.image_url) score += 2;
  if (article.category && article.category !== "Uncategorized") score += 1;
  if (article.excerpt) score += 1;
  return score;
}

function pickBetterArticle(existing, candidate) {
  return articleRowScore(candidate) >= articleRowScore(existing) ? candidate : existing;
}

export function buildArticlesFromRows(rows) {
  const seen = new Map();
  let skippedSpam = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]._normalized ? rows[i] : { ...rows[i], _normalized: normalizeRecord(rows[i]) };
    if (isCasinoGamblingSpam(row._normalized ?? row)) {
      skippedSpam++;
      continue;
    }
    const mapped = mapArticleRow(row, i);
    if (mapped) {
      const prev = seen.get(mapped.id);
      seen.set(mapped.id, prev ? pickBetterArticle(prev, mapped) : mapped);
    }
  }

  return {
    articles: [...seen.values()],
    skippedSpam,
    sourceCount: rows.length,
  };
}

async function upsertBatchWithRetry(supabase, batch, batchIndex) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { error } = await supabase
        .from("articles")
        .upsert(batch, { onConflict: "id" });

      if (error) throw error;
      return;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_RETRIES) break;

      const waitSec = attempt * 3;
      console.warn(
        `  Batch ${batchIndex} failed (attempt ${attempt}/${MAX_RETRIES}): ${formatImportError(err)}`,
      );
      console.warn(`  Retrying in ${waitSec}s…`);
      await sleep(waitSec * 1000);
    }
  }

  throw lastError;
}

export async function upsertArticlesToSupabase(supabase, articles) {
  const totalBatches = Math.ceil(articles.length / BATCH_SIZE);

  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    const batchIndex = Math.floor(i / BATCH_SIZE) + 1;

    await upsertBatchWithRetry(supabase, batch, batchIndex);

    console.log(
      `  ${Math.min(i + BATCH_SIZE, articles.length)} / ${articles.length} (batch ${batchIndex}/${totalBatches})`,
    );
  }
}

export function getSupabaseAdmin() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
    );
  }
  return { url, key };
}
