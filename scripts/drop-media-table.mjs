/**
 * Checks for public.media and prints drop instructions.
 * Supabase JS cannot run DDL — use SQL Editor or psql.
 *
 * Usage: node scripts/drop-media-table.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !service) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const client = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const probe = await client.from("media").select("id", { count: "exact", head: true });

if (
  probe.error?.code === "PGRST205" ||
  probe.error?.message?.toLowerCase().includes("does not exist") ||
  probe.error?.message?.toLowerCase().includes("could not find")
) {
  console.log("OK — public.media is not present (already removed).");
  process.exit(0);
}

if (probe.error) {
  console.error("Could not probe media table:", probe.error.message);
  process.exit(1);
}

console.log(`Found public.media (${probe.count ?? "?"} rows).`);
console.log("\nRun this in Supabase → SQL Editor:\n");
console.log(readFileSync(join(root, "supabase/migrations/007_drop_media.sql"), "utf8"));
