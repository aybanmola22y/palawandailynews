/**
 * Import articles from CSV into Supabase.
 *
 * Place your file at: data/extracted.csv
 *
 * Run: npm run import-articles:supabase
 *      node --env-file=.env scripts/import-from-csv.mjs path/to/export.csv
 */
import "./lib/node-websocket.mjs";
import path from "path";
import { access } from "fs/promises";
import { loadCsvRows } from "./lib/parse-csv.mjs";
import {
  buildArticlesFromRows,
  formatImportError,
  upsertArticlesToSupabase,
} from "./lib/article-import.mjs";
import { createSupabaseAdminClient } from "./lib/supabase-admin.mjs";

const DEFAULT_CSV = path.join(process.cwd(), "data", "extracted.csv");

async function resolveInputFile() {
  if (process.argv[2]) return path.resolve(process.argv[2]);
  try {
    await access(DEFAULT_CSV);
    return DEFAULT_CSV;
  } catch {
    throw new Error(
      `No CSV found. Save your export as data/extracted.csv or pass a path:\n` +
        `  node --env-file=.env scripts/import-from-csv.mjs path/to/file.csv`,
    );
  }
}

async function main() {
  const inFile = await resolveInputFile();

  console.log(`Reading ${inFile}…`);
  const rows = await loadCsvRows(inFile);
  const { articles, skippedSpam, sourceCount } = buildArticlesFromRows(rows);

  console.log(`Source rows: ${sourceCount}`);
  if (skippedSpam) console.log(`Skipped casino/gambling spam: ${skippedSpam}`);
  console.log(`Upserting ${articles.length} articles to Supabase…`);

  const supabase = createSupabaseAdminClient();
  await upsertArticlesToSupabase(supabase, articles);
  console.log("Done. Restart npm run dev to load articles on the site.");
}

main().catch((err) => {
  console.error("\nImport failed:", formatImportError(err));
  console.error(
    "\nTips: check internet/VPN, confirm Supabase project is active, then run the command again (upsert is safe to retry).",
  );
  process.exit(1);
});
