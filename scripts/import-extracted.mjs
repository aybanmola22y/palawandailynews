/**
 * Import extracted articles from the old website into imported-articles.json
 *
 * Place your extract at: data/extracted.json
 *
 * Expected shape (array or { articles: [] }):
 * {
 *   "title": "Headline",
 *   "slug": "url-slug",           // optional; derived from title if missing
 *   "excerpt": "Plain text...",
 *   "content": "<p>HTML...</p>",  // optional; excerpt used if missing
 *   "author": "Author Name",
 *   "date": "2022-05-27T00:00:00",
 *   "category": "Lifestyle",
 *   "image": "https://...",
 *   "status": "Published"         // optional
 * }
 *
 * Run: node scripts/import-extracted.mjs
 *      node scripts/import-extracted.mjs path/to/your-export.json
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { writeImportMeta } from "./write-import-meta.mjs";
import { isCasinoGamblingSpam } from "./lib/spam-filter.mjs";

const IN_FILE = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "data", "extracted.json");
const OUT_FILE = path.join(process.cwd(), "src", "data", "imported-articles.json");

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function estimateReadingTime(text) {
  const words = String(text).split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function stripHtml(html) {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mapRow(row, index) {
  const title = String(row.title ?? "").trim();
  if (!title) return null;

  const slug = String(row.slug ?? row.id ?? slugify(title) || `article-${index}`).trim();
  const excerpt = String(row.excerpt ?? stripHtml(row.content) ?? "").trim();
  const content = String(row.content ?? row.body ?? `<p>${excerpt}</p>`).trim();
  const plain = stripHtml(content);

  return {
    id: slug,
    title,
    excerpt,
    content,
    category: String(row.category ?? "News").trim() || "News",
    author: String(row.author ?? "Palawan Daily News").trim() || "Palawan Daily News",
    date: row.date ?? row.publishedAt ?? new Date().toISOString(),
    readingTime: row.readingTime ?? estimateReadingTime(plain || excerpt),
    image: String(row.image ?? row.imageUrl ?? row.featuredImage ?? "").trim(),
    isBreaking: Boolean(row.isBreaking),
    status: row.status === "Draft" || row.status === "Review" ? row.status : "Published",
    legacyWpId: row.wpId ?? row.legacyWpId ?? row.id ?? undefined,
  };
}

async function main() {
  const raw = await readFile(IN_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : parsed.articles ?? parsed.items ?? [];

  if (!Array.isArray(rows) || !rows.length) {
    throw new Error(`No articles found in ${IN_FILE}`);
  }

  const seen = new Map();
  let skippedSpam = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (isCasinoGamblingSpam(row)) {
      skippedSpam++;
      continue;
    }
    const mapped = mapRow(row, i);
    if (!mapped) continue;
    seen.set(mapped.id, mapped);
  }

  const articles = [...seen.values()].sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date),
  );

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, JSON.stringify(articles, null, 2), "utf8");
  const meta = await writeImportMeta(articles);
  console.log(`Source rows: ${rows.length}`);
  if (skippedSpam) {
    console.log(`Skipped casino/gambling spam: ${skippedSpam}`);
  }
  console.log(`Imported ${articles.length} articles → ${OUT_FILE}`);
  console.log(`Revision ${meta.revision} — hard-refresh the site to load them.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
