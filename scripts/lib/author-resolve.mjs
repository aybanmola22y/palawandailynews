import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const config = JSON.parse(
  readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), "../../src/data/author-aliases.json"),
    "utf8",
  ),
);

const PUBLICATION_NAME = "Palawan Daily News";

const ALIAS_MAP = new Map(
  Object.entries(config.aliases).map(([k, v]) => [k.toLowerCase(), v]),
);

const GENERIC_SET = new Set(config.generic.map((g) => g.toLowerCase()));

function normalizeKey(value) {
  return value.trim().toLowerCase();
}

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

function resolveFromEmail(email) {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return null;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  const localKey = normalizeKey(local);
  const fullKey = normalizeKey(trimmed);

  if (ALIAS_MAP.has(fullKey)) return ALIAS_MAP.get(fullKey);
  if (GENERIC_SET.has(fullKey) || GENERIC_SET.has(localKey)) return PUBLICATION_NAME;

  if (domain === "pdn" || domain.endsWith("palawandailynews.com")) {
    if (local.includes("_") || local.includes(".")) return nameFromSlug(local);
  }

  if (/^(gmail|yahoo|hotmail|outlook|live|icloud)\./i.test(domain) || domain.includes(".")) {
    return PUBLICATION_NAME;
  }

  return nameFromSlug(local);
}

export function resolveAuthorDisplayName(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return PUBLICATION_NAME;

  const key = normalizeKey(trimmed);
  if (GENERIC_SET.has(key)) return PUBLICATION_NAME;
  if (ALIAS_MAP.has(key)) return ALIAS_MAP.get(key);

  if (trimmed.includes("@")) {
    return resolveFromEmail(trimmed) ?? PUBLICATION_NAME;
  }

  if (key.startsWith("pdn") && (key.includes("admin") || key.includes("staff"))) {
    return PUBLICATION_NAME;
  }

  if (trimmed.includes("_") || trimmed.includes(".") || trimmed.includes("-")) {
    return nameFromSlug(trimmed);
  }

  if (trimmed.includes(" ")) {
    return trimmed.split(/\s+/).map(titleCaseWord).join(" ");
  }

  return titleCaseWord(trimmed);
}
