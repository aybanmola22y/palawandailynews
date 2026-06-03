import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = readFileSync(join(root, ".env"), "utf8");
for (const line of raw.split("\n")) {
  const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[m[1]] = v;
}

const c = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const col = await c.from("articles").select("cms_origin").limit(1);
console.log("cms_origin:", col.error?.message ?? "ok");

const drafts = await c
  .from("articles")
  .select("id", { count: "exact", head: true })
  .eq("status", "Draft");
console.log("all drafts:", drafts.count ?? drafts.error?.message);

const cms = await c
  .from("articles")
  .select("id", { count: "exact", head: true })
  .eq("status", "Draft")
  .eq("cms_origin", true);
console.log("cms drafts:", cms.count ?? cms.error?.message);
