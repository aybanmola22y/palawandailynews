/**
 * List opinion/column authors and resolved display names.
 * Usage: node scripts/list-opinion-authors.mjs
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
    /* ignore */
  }
}

loadEnv();

const authorConfig = JSON.parse(
  readFileSync(join(root, "src/data/author-aliases.json"), "utf8"),
);

const ALIAS_MAP = new Map(
  Object.entries(authorConfig.aliases).map(([k, v]) => [k.toLowerCase(), v]),
);

function titleCaseWord(word) {
  const lower = word.toLowerCase();
  const suffixes = { jr: "Jr.", sr: "Sr.", ii: "II", iii: "III", iv: "IV" };
  const suffixKey = lower.replace(/[^a-z0-9]/g, "");
  if (suffixes[suffixKey]) return suffixes[suffixKey];
  if (word.length <= 2 && word === word.toUpperCase()) return word.toUpperCase();
  if (word === word.toUpperCase() && word.length > 1) {
    return word.charAt(0) + word.slice(1).toLowerCase();
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function nameFromSlug(slug) {
  return slug
    .replace(/[-.]/g, "_")
    .split("_")
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");
}

function resolve(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return "Palawan Daily News";
  const key = trimmed.toLowerCase();
  if (ALIAS_MAP.has(key)) return ALIAS_MAP.get(key);
  if (trimmed.includes("_") || trimmed.includes(".") || trimmed.includes("-")) {
    return nameFromSlug(trimmed);
  }
  if (trimmed.includes(" ")) {
    return trimmed.split(/\s+/).map(titleCaseWord).join(" ");
  }
  return titleCaseWord(trimmed);
}

function looksIncomplete(raw, display) {
  if (!raw?.trim() || display === "Palawan Daily News") return false;
  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length === 1 && parts[0].length < 12) return true;
  if (parts.length >= 2 && parts[0].replace(/\./g, "").length <= 2) return true;
  if (/^[a-z]$/i.test(parts[0]) && parts.length === 2) return true;
  if (display === raw && !raw.includes(" ") && raw.length < 15) return true;
  return false;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !service) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const client = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await client
  .from("articles")
  .select("author, category, status")
  .limit(10000);

if (error) {
  console.error(error.message);
  process.exit(1);
}

const byAuthor = new Map();
for (const row of data ?? []) {
  const cat = (row.category ?? "").toLowerCase();
  if (cat !== "opinion" && cat !== "column") continue;
  const a = row.author?.trim();
  if (!a) continue;
  byAuthor.set(a, (byAuthor.get(a) ?? 0) + 1);
}

const rows = [...byAuthor.entries()]
  .map(([raw, count]) => ({
    raw,
    display: resolve(raw),
    incomplete: looksIncomplete(raw, resolve(raw)),
    count,
  }))
  .sort((a, b) => b.count - a.count);

console.log("Incomplete opinion/column authors:\n");
for (const r of rows.filter((x) => x.incomplete)) {
  console.log(`  ${JSON.stringify(r.raw)} -> ${JSON.stringify(r.display)} (${r.count})`);
}

console.log("\nAll opinion authors:\n");
for (const r of rows) {
  console.log(
    `  ${r.incomplete ? "!" : " "} ${JSON.stringify(r.raw)} -> ${JSON.stringify(r.display)} (${r.count})`,
  );
}
