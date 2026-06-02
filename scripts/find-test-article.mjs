import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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
    /* ignore */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const title =
  "New Coastal Road Project Set to Improve Access for Northern Palawan Communities";

const { data: exact, error: e1 } = await client
  .from("articles")
  .select("id, title, status, date, author, category, updated_at")
  .eq("title", title);

if (e1) console.error(e1);
else console.log("Exact title matches:", exact?.length, exact);

const { data: author, error: e2 } = await client
  .from("articles")
  .select("id, title, status, date, author")
  .ilike("author", "%molato%");

if (e2) console.error(e2);
else console.log("Author molato:", author);

const { count } = await client
  .from("articles")
  .select("id", { count: "exact", head: true })
  .eq("status", "Published");

console.log("Published count:", count);

const { data: coastal } = await client
  .from("articles")
  .select("id, title, status, date, author")
  .ilike("title", "%coastal road%")
  .limit(10);
console.log("coastal road ilike:", coastal);

const { data: recent } = await client
  .from("articles")
  .select("id, title, status, date, updated_at")
  .order("updated_at", { ascending: false })
  .limit(8);
console.log("most recently updated:", recent);
