import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleRow, Database } from "@/lib/supabase/database.types";

const META_ID = 1;

function isMissingMetaTable(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("article_backup_meta") &&
    (m.includes("does not exist") || m.includes("schema cache"))
  );
}

export async function isBackupMetaConfigured(
  client: SupabaseClient<Database>,
): Promise<boolean> {
  const { error } = await client
    .from("article_backup_meta")
    .select("id")
    .eq("id", META_ID)
    .maybeSingle();

  if (error) return !isMissingMetaTable(error.message ?? "");
  return true;
}

export async function getLastBackupAt(
  client: SupabaseClient<Database>,
): Promise<string | null> {
  const { data, error } = await client
    .from("article_backup_meta")
    .select("last_backup_at")
    .eq("id", META_ID)
    .maybeSingle();

  if (error) {
    if (isMissingMetaTable(error.message ?? "")) return null;
    throw error;
  }
  return data?.last_backup_at ?? null;
}

export async function setLastBackupAt(
  client: SupabaseClient<Database>,
  iso: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await client.from("article_backup_meta").upsert({
    id: META_ID,
    last_backup_at: iso,
    updated_at: new Date().toISOString(),
  } as never);

  if (error) {
    if (isMissingMetaTable(error.message ?? "")) {
      return {
        ok: false,
        error:
          'Table "article_backup_meta" is missing. Run scripts/create-article-backup-meta.sql in Supabase SQL Editor.',
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function countArticlesPendingBackup(
  client: SupabaseClient<Database>,
  lastBackupAt: string | null,
): Promise<number> {
  let query = client
    .from("articles")
    .select("id", { count: "exact", head: true });

  if (lastBackupAt) {
    query = query.gt("created_at", lastBackupAt);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function fetchArticlesPendingBackup(
  client: SupabaseClient<Database>,
  lastBackupAt: string | null,
): Promise<ArticleRow[]> {
  const pageSize = 200;
  const all: ArticleRow[] = [];
  let offset = 0;

  while (true) {
    let query = client
      .from("articles")
      .select("*")
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (lastBackupAt) {
      query = query.gt("created_at", lastBackupAt);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) break;

    all.push(...(data as ArticleRow[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

export async function fetchPendingBackupPreview(
  client: SupabaseClient<Database>,
  lastBackupAt: string | null,
  limit = 5,
): Promise<{ id: string; title: string; created_at: string }[]> {
  let query = client
    .from("articles")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (lastBackupAt) {
    query = query.gt("created_at", lastBackupAt);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as { id: string; title: string; created_at: string }[];
}
