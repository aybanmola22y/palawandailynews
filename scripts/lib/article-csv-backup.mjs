import { mkdir, readFile, appendFile, access } from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

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
];

const DEFAULT_BACKUP_PATH = path.join(
  process.cwd(),
  "data",
  "backups",
  "articles-backup.csv",
);

export function getBackupCsvPath() {
  const custom = process.env.ARTICLE_BACKUP_CSV_PATH?.trim();
  return custom ? path.resolve(custom) : DEFAULT_BACKUP_PATH;
}

export function escapeCsvField(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function tagsToCsvCell(tags) {
  if (tags == null) return "";
  if (Array.isArray(tags)) return tags.join("|");
  return String(tags);
}

export function articleRowToCsvRecord(row) {
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

export function recordToCsvLine(record) {
  return BACKUP_CSV_COLUMNS.map((col) => escapeCsvField(record[col])).join(",");
}

export async function readBackedUpArticleIds(csvPath) {
  try {
    await access(csvPath);
  } catch {
    return new Set();
  }

  const raw = await readFile(csvPath, "utf8");
  const trimmed = raw.trim();
  if (!trimmed) return new Set();

  const records = parse(trimmed, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  });

  const ids = new Set();
  for (const row of records) {
    const id = String(row.id ?? row.ID ?? "").trim();
    if (id) ids.add(id);
  }
  return ids;
}

export async function appendArticlesToBackupCsv(articles, csvPath = getBackupCsvPath()) {
  await mkdir(path.dirname(csvPath), { recursive: true });

  let needsHeader = true;
  try {
    await access(csvPath);
    const existing = await readFile(csvPath, "utf8");
    needsHeader = !existing.trim();
  } catch {
    needsHeader = true;
  }

  const lines = [];
  if (needsHeader) {
    lines.push(BACKUP_CSV_COLUMNS.join(","));
  }

  for (const row of articles) {
    lines.push(recordToCsvLine(articleRowToCsvRecord(row)));
  }

  if (!lines.length) return { appended: 0, csvPath };

  await appendFile(csvPath, `${lines.join("\n")}\n`, "utf8");
  return { appended: articles.length, csvPath };
}
