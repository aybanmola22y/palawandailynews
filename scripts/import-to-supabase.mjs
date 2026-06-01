/**
 * Bulk-import articles from JSON into Supabase (service role).
 *
 * Usage:
 *   node --env-file=.env scripts/import-to-supabase.mjs
 *   node --env-file=.env scripts/import-to-supabase.mjs path/to/extracted.json
 */
import "./lib/node-websocket.mjs";
import { readFile } from "fs/promises";
import path from "path";
import {
  buildArticlesFromRows,
  upsertArticlesToSupabase,
} from "./lib/article-import.mjs";
import { createSupabaseAdminClient } from "./lib/supabase-admin.mjs";

const IN_FILE = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), "data", "extracted.json");

async function main() {
  const raw = await readFile(IN_FILE, "utf8");
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : parsed.articles ?? parsed.items ?? [];
  if (!rows.length) throw new Error(`No articles in ${IN_FILE}`);

  const { articles, skippedSpam, sourceCount } = buildArticlesFromRows(rows);

  console.log(`Source rows: ${sourceCount}`);
  if (skippedSpam) console.log(`Skipped casino/gambling spam: ${skippedSpam}`);
  console.log(`Upserting ${articles.length} articles to Supabase…`);

  await upsertArticlesToSupabase(createSupabaseAdminClient(), articles);
  console.log("Done. Restart npm run dev to load articles on the site.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
