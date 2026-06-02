import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env"), "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i <= 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
    v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

const need = [
  "jbautista",
  "alphaedge",
  "giogabuco",
  "greg",
  "L.Escaros",
  "p.henderson",
  "sheencubilan@gmail.com",
  "awtungbaban",
  "sungai",
  "leven",
  "yolly",
  "harley",
  "erwin",
  "francis",
];

const c = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

for (const author of need) {
  const { data } = await c
    .from("articles")
    .select("title, content, excerpt")
    .eq("author", author)
    .limit(1);
  const row = data?.[0];
  const snippet = (row?.content || row?.excerpt || "").slice(0, 500);
  console.log("\n===", author, "===");
  console.log("title:", row?.title);
  console.log("snippet:", snippet.replace(/\s+/g, " ").slice(0, 200));
}
