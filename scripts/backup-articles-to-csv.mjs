/**
 * Incremental CSV backup on this computer (not Supabase).
 * Appends only articles that are not already listed in the CSV (by id).
 *
 * Default file: data/backups/articles-backup.csv
 * Override:    ARTICLE_BACKUP_CSV_PATH=C:\Backups\pdn-articles.csv
 *
 * Run on your laptop after publishing, or schedule it (Task Scheduler):
 *   npm run backup-articles:csv
 */
import "./lib/node-websocket.mjs";
import { createSupabaseAdminClient } from "./lib/supabase-admin.mjs";
import { formatImportError } from "./lib/article-import.mjs";
import {
  appendArticlesToBackupCsv,
  getBackupCsvPath,
  readBackedUpArticleIds,
} from "./lib/article-csv-backup.mjs";

const PAGE_SIZE = 100;
const INSERT_BATCH = 40;

async function main() {
  const csvPath = getBackupCsvPath();
  const backedUpIds = await readBackedUpArticleIds(csvPath);
  console.log(`Backup file: ${csvPath}`);
  console.log(`Already in CSV: ${backedUpIds.size} article(s)\n`);

  const supabase = createSupabaseAdminClient();

  const { count: total, error: countError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true });

  if (countError) throw countError;
  const articleCount = total ?? 0;
  console.log(`Articles in Supabase: ${articleCount}`);

  let appended = 0;
  let offset = 0;

  while (offset < articleCount) {
    const { data: page, error: pageError } = await supabase
      .from("articles")
      .select("*")
      .order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (pageError) throw pageError;
    if (!page?.length) break;

    const missing = page.filter((row) => !backedUpIds.has(row.id));

    for (let i = 0; i < missing.length; i += INSERT_BATCH) {
      const batch = missing.slice(i, i + INSERT_BATCH);
      const { appended: n } = await appendArticlesToBackupCsv(batch, csvPath);
      appended += n;
      for (const row of batch) backedUpIds.add(row.id);
    }

    offset += page.length;
    if (offset % 500 < PAGE_SIZE || offset >= articleCount) {
      console.log(`  Scanned: ${Math.min(offset, articleCount)} / ${articleCount}`);
    }
  }

  console.log("\nDone.");
  console.log(`  New rows appended this run: ${appended}`);
  console.log(`  Total in CSV now:          ${backedUpIds.size}`);
  console.log(
    "\nTip: run this after you publish new stories, or schedule it daily on your laptop.",
  );
}

main().catch((err) => {
  console.error("\nBackup failed:", formatImportError(err));
  process.exit(1);
});
