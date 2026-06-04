import type { ArticleRow } from "@/lib/supabase/database.types";
import { normalizeArticleTags } from "@/lib/articles/map-article-row";

export const BACKUP_CSV_COLUMNS = [
  "id",
  "title",
  "excerpt",
  "content",
  "category",
  "author",
  "tags",
  "date",
  "reading_time",
  "image_url",
  "status",
  "is_breaking",
  "legacy_wp_id",
  "cms_origin",
  "created_at",
  "updated_at",
  "backed_up_at",
] as const;

function escapeCsvField(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function tagsToCsvCell(tags: unknown): string {
  return normalizeArticleTags(tags).join("|");
}

export function articleRowToCsvRecord(row: ArticleRow) {
  return {
    id: row.id,
    title: row.title ?? "",
    excerpt: row.excerpt ?? "",
    content: row.content ?? "",
    category: row.category ?? "News",
    author: row.author ?? "",
    tags: tagsToCsvCell(row.tags),
    date: row.date ?? "",
    reading_time: row.reading_time ?? "",
    image_url: row.image_url ?? "",
    status: row.status ?? "Published",
    is_breaking: row.is_breaking ? "true" : "false",
    legacy_wp_id: row.legacy_wp_id ?? "",
    cms_origin: row.cms_origin ? "true" : "false",
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? "",
    backed_up_at: new Date().toISOString(),
  };
}

export function articleRowToCsvLine(row: ArticleRow): string {
  const record = articleRowToCsvRecord(row);
  return BACKUP_CSV_COLUMNS.map((col) => escapeCsvField(record[col])).join(",");
}

export function backupCsvHeaderLine(): string {
  return `${BACKUP_CSV_COLUMNS.join(",")}\n`;
}

export function buildArticlesBackupCsv(rows: ArticleRow[]): string {
  const lines = [BACKUP_CSV_COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(articleRowToCsvLine(row));
  }
  return `${lines.join("\n")}\n`;
}

export function backupCsvFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `palawan-daily-news-backup-${date}.csv`;
}
