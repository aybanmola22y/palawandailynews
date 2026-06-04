import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ArticleBackupInsertRow,
  ArticleBackupSource,
  ArticleRow,
  Database,
} from "@/lib/supabase/database.types";
import { normalizeArticleTags } from "@/lib/articles/map-article-row";

const BATCH_SIZE = 40;

export function articleRowToBackupInsert(
  row: ArticleRow,
  source: ArticleBackupSource,
): ArticleBackupInsertRow {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    category: row.category ?? "News",
    author: row.author ?? "",
    tags: normalizeArticleTags(row.tags),
    date: row.date ?? "",
    reading_time: row.reading_time ?? "",
    image_url: row.image_url ?? "",
    is_breaking: Boolean(row.is_breaking),
    status: row.status ?? "Published",
    legacy_wp_id: row.legacy_wp_id ?? null,
    cms_origin: row.cms_origin === true,
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
    backed_up_at: new Date().toISOString(),
    backup_source: source,
  };
}

function isDuplicateBackupError(message: string): boolean {
  return message.toLowerCase().includes("duplicate");
}

function isMissingBackupTableError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("article_backups") &&
    (m.includes("does not exist") || m.includes("schema cache"))
  );
}

/** Insert one article snapshot (skips if already backed up). Used after CMS create. */
export async function appendArticleToBackup(
  client: SupabaseClient<Database>,
  row: ArticleRow,
  source: ArticleBackupSource = "create",
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const payload = articleRowToBackupInsert(row, source);
  let { error } = await client.from("article_backups").insert(payload as never);

  if (
    error &&
    typeof error.message === "string" &&
    error.message.includes('column "tags"')
  ) {
    const { tags: _tags, ...withoutTags } = payload;
    ({ error } = await client.from("article_backups").insert(withoutTags as never));
  }

  if (!error) return { ok: true };

  const message = error.message ?? "Backup insert failed";
  if (isDuplicateBackupError(message)) {
    return { ok: true, skipped: true };
  }
  if (isMissingBackupTableError(message)) {
    return {
      ok: false,
      error:
        'Table "article_backups" is missing. Run scripts/create-article-backups-table.sql in Supabase SQL Editor.',
    };
  }
  return { ok: false, error: message };
}

/** Seed backup rows for articles not yet in article_backups (idempotent). */
export async function seedArticleBackups(
  client: SupabaseClient<Database>,
  options: { onProgress?: (done: number, total: number) => void } = {},
): Promise<{
  articleCount: number;
  inserted: number;
  alreadyBackedUp: number;
}> {
  const { count, error: countError } = await client
    .from("articles")
    .select("id", { count: "exact", head: true });

  if (countError) throw countError;
  const articleCount = count ?? 0;

  let inserted = 0;
  let alreadyBackedUp = 0;
  const pageSize = 100;
  let offset = 0;

  while (offset < articleCount) {
    const { data: page, error: pageError } = await client
      .from("articles")
      .select("*")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (pageError) throw pageError;
    if (!page?.length) break;

    const ids = page.map((r) => r.id);
    const { data: existing, error: existingError } = await client
      .from("article_backups")
      .select("id")
      .in("id", ids);

    if (existingError) throw existingError;

    const existingSet = new Set((existing ?? []).map((r) => r.id));
    const missing = page.filter((r) => !existingSet.has(r.id));
    alreadyBackedUp += page.length - missing.length;

    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing
        .slice(i, i + BATCH_SIZE)
        .map((row) => articleRowToBackupInsert(row as ArticleRow, "seed"));

      const { error: insertError } = await client
        .from("article_backups")
        .insert(batch as never);

      if (insertError) {
        if (isMissingBackupTableError(insertError.message ?? "")) {
          throw new Error(
            'Table "article_backups" is missing. Run scripts/create-article-backups-table.sql in Supabase SQL Editor.',
          );
        }
        throw insertError;
      }
      inserted += batch.length;
    }

    offset += page.length;
    options.onProgress?.(Math.min(offset, articleCount), articleCount);
  }

  return { articleCount, inserted, alreadyBackedUp };
}

export async function getArticleBackupCounts(
  client: SupabaseClient<Database>,
): Promise<{ articles: number; backups: number } | null> {
  const [articlesRes, backupsRes] = await Promise.all([
    client.from("articles").select("id", { count: "exact", head: true }),
    client.from("article_backups").select("id", { count: "exact", head: true }),
  ]);

  if (articlesRes.error || backupsRes.error) return null;

  return {
    articles: articlesRes.count ?? 0,
    backups: backupsRes.count ?? 0,
  };
}
