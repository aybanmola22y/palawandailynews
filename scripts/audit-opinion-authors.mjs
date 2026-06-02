/**
 * Paginated audit of opinion/column authors.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
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
const GENERIC = new Set(authorConfig.generic.map((g) => g.toLowerCase()));

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
  if (GENERIC.has(key)) return "Palawan Daily News";
  if (ALIAS_MAP.has(key)) return ALIAS_MAP.get(key);
  if (trimmed.includes("@")) {
    const at = trimmed.indexOf("@");
    const local = trimmed.slice(0, at);
    const domain = trimmed.slice(at + 1).toLowerCase();
    if (ALIAS_MAP.has(trimmed.toLowerCase())) return ALIAS_MAP.get(trimmed.toLowerCase());
    if (domain === "pdn" || domain.endsWith("palawandailynews.com")) {
      if (local.includes("_") || local.includes(".")) return nameFromSlug(local);
    }
    return nameFromSlug(local);
  }
  if (trimmed.includes("_") || trimmed.includes(".") || trimmed.includes("-")) {
    return nameFromSlug(trimmed);
  }
  if (trimmed.includes(" ")) {
    return trimmed.split(/\s+/).map(titleCaseWord).join(" ");
  }
  return titleCaseWord(trimmed);
}

function needsAlias(raw, display) {
  if (!raw?.trim() || display === "Palawan Daily News") return false;
  if (GENERIC.has(raw.toLowerCase())) return false;
  const parts = display.split(/\s+/).filter(Boolean);
  // Single word login
  if (parts.length === 1) return true;
  // Initial + surname only (R Casimiro, L Escaros, A. Marquez style)
  const first = parts[0].replace(/\./g, "");
  if (first.length <= 2 && parts.length === 2) return true;
  // Display still looks like slug (Jbautista)
  if (!raw.includes(" ") && display.replace(/\s/g, "") === titleCaseWord(raw).replace(/\s/g, ""))
    return parts.length < 3;
  return false;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const client = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const pageSize = 1000;
let from = 0;
const all = [];
while (true) {
  const { data, error } = await client
    .from("articles")
    .select("author, category, status")
    .range(from, from + pageSize - 1);
  if (error) throw error;
  if (!data?.length) break;
  all.push(...data);
  if (data.length < pageSize) break;
  from += pageSize;
}

const byAuthor = new Map();
const categories = new Set();
for (const row of all) {
  if (row.status !== "Published") continue;
  categories.add(row.category ?? "");
  const cat = (row.category ?? "").toLowerCase();
  if (cat !== "opinion" && cat !== "column") continue;
  const a = row.author?.trim();
  if (!a || GENERIC.has(a.toLowerCase())) continue;
  byAuthor.set(a, (byAuthor.get(a) ?? 0) + 1);
}

const rows = [...byAuthor.entries()]
  .map(([raw, count]) => ({ raw, display: resolve(raw), count }))
  .sort((a, b) => b.count - a.count);

const incomplete = rows.filter((r) => needsAlias(r.raw, r.display));

console.log("Published opinion/column authors:", rows.length);
console.log("Need aliases:", incomplete.length, "\n");
for (const r of incomplete) {
  console.log(JSON.stringify(r.raw), "->", JSON.stringify(r.display), `(${r.count})`);
}

writeFileSync(
  join(root, "scripts/opinion-authors-audit.json"),
  JSON.stringify({ incomplete, all: rows }, null, 2),
);
