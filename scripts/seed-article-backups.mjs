/**
 * One-time (or safe repeat) seed: copy every article not yet in article_backups.
 *
 * Prerequisite: run scripts/create-article-backups-table.sql in Supabase SQL Editor.
 *
 * Run: npm run seed-article-backups
 */
import "./lib/node-websocket.mjs";
import { createSupabaseAdminClient } from "./lib/supabase-admin.mjs";
import { formatImportError } from "./lib/article-import.mjs";

const BATCH_LOG = 500;

async function seedWithAdminClient(supabase) {
  const { count: articleCount, error: countError } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true });

  if (countError) throw countError;
  const total = articleCount ?? 0;
  console.log(`Articles in database: ${total}`);

  let inserted = 0;
  let alreadyBackedUp = 0;
  const pageSize = 100;
  let offset = 0;

  while (offset < total) {
    const { data: page, error: pageError } = await supabase
      .from("articles")
      .select("*")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (pageError) throw pageError;
    if (!page?.length) break;

    const ids = page.map((r) => r.id);
    const { data: existing, error: existingError } = await supabase
      .from("article_backups")
      .select("id")
      .in("id", ids);

    if (existingError) throw existingError;

    const existingSet = new Set((existing ?? []).map((r) => r.id));
    const missing = page.filter((r) => !existingSet.has(r.id));
    alreadyBackedUp += page.length - missing.length;

    const batchSize = 40;
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize).map((row) => ({
        id: row.id,
        title: row.title,
        excerpt: row.excerpt ?? "",
        content: row.content ?? "",
        category: row.category ?? "News",
        author: row.author ?? "",
        tags: normalizeTags(row.tags),
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
        backup_source: "seed",
      }));

      const { error: insertError } = await supabase
        .from("article_backups")
        .insert(batch);

      if (insertError) throw insertError;
      inserted += batch.length;
    }

    offset += page.length;
    if (offset % BATCH_LOG < pageSize || offset >= total) {
      console.log(`  Progress: ${Math.min(offset, total)} / ${total}`);
    }
  }

  const { count: backupCount } = await supabase
    .from("article_backups")
    .select("id", { count: "exact", head: true });

  return {
    articleCount: total,
    inserted,
    alreadyBackedUp,
    backupCount: backupCount ?? 0,
  };
}

function normalizeTags(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((t) => String(t).trim()).filter(Boolean))].slice(0, 30);
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    return [...new Set(s.split(/[|,]/g).map((t) => t.trim()).filter(Boolean))].slice(0, 30);
  }
  return [];
}

async function main() {
  const supabase = createSupabaseAdminClient();
  console.log("Seeding article_backups from articles…\n");

  const result = await seedWithAdminClient(supabase);

  console.log("\nDone.");
  console.log(`  Newly backed up this run: ${result.inserted}`);
  console.log(`  Already in backup:       ${result.alreadyBackedUp}`);
  console.log(`  Total backup rows:       ${result.backupCount}`);
  console.log(
    "\nNew articles created in the CMS will be added to backup automatically.",
  );
}

main().catch((err) => {
  console.error("\nSeed failed:", formatImportError(err));
  console.error(
    "\nIf the table is missing, run scripts/create-article-backups-table.sql in Supabase → SQL Editor, then retry.",
  );
  process.exit(1);
});
