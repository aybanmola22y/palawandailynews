import authorConfig from "@/data/author-aliases.json";

const PUBLICATION_NAME = "Palawan Daily News";

const ALIAS_MAP = new Map(
  Object.entries(authorConfig.aliases).map(([k, v]) => [k.toLowerCase(), v]),
);

const GENERIC_SET = new Set(
  authorConfig.generic.map((g) => g.toLowerCase()),
);

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function titleCaseWord(word: string) {
  const lower = word.toLowerCase();
  const suffixes: Record<string, string> = {
    jr: "Jr.",
    sr: "Sr.",
    ii: "II",
    iii: "III",
    iv: "IV",
  };
  // Normalize tokens like "jr," or "jr " to match suffix keys.
  const suffixKey = lower.replace(/[^a-z0-9]/g, "");
  if (suffixes[suffixKey]) {
    return suffixes[suffixKey];
  }
  if (word.length <= 2 && word === word.toUpperCase()) {
    return word.toUpperCase();
  }
  if (word === word.toUpperCase() && word.length > 1) {
    return word.charAt(0) + word.slice(1).toLowerCase();
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function nameFromSlug(slug: string) {
  return slug
    .replace(/[-.]/g, "_")
    .split("_")
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");
}

function resolveFromEmail(email: string) {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return null;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();
  const localKey = normalizeKey(local);
  const fullKey = normalizeKey(trimmed);

  if (ALIAS_MAP.has(fullKey)) return ALIAS_MAP.get(fullKey)!;
  if (GENERIC_SET.has(fullKey) || GENERIC_SET.has(localKey)) {
    return PUBLICATION_NAME;
  }

  // Firstname_Lastname@PDN
  if (domain === "pdn" || domain.endsWith("palawandailynews.com")) {
    if (local.includes("_") || local.includes(".")) {
      return nameFromSlug(local);
    }
  }

  // Personal email — don't show the address as the byline
  if (/^(gmail|yahoo|hotmail|outlook|live|icloud)\./i.test(domain) || domain.includes(".")) {
    return PUBLICATION_NAME;
  }

  return nameFromSlug(local);
}

/** Resolve WordPress login / email / slug → readable byline. */
export function resolveAuthorDisplayName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return PUBLICATION_NAME;

  const key = normalizeKey(trimmed);

  if (GENERIC_SET.has(key)) return PUBLICATION_NAME;
  if (ALIAS_MAP.has(key)) return ALIAS_MAP.get(key)!;

  if (trimmed.includes("@")) {
    return resolveFromEmail(trimmed) ?? PUBLICATION_NAME;
  }

  if (key.startsWith("pdn") && (key.includes("admin") || key.includes("staff"))) {
    return PUBLICATION_NAME;
  }

  if (trimmed.includes("_") || trimmed.includes(".") || trimmed.includes("-")) {
    return nameFromSlug(trimmed);
  }

  // Already a proper name (mixed case or spaces)
  if (trimmed.includes(" ")) {
    return trimmed
      .split(/\s+/)
      .map(titleCaseWord)
      .join(" ");
  }

  // Unknown single-word login — use alias if added later, else title-case as fallback
  return titleCaseWord(trimmed);
}

export function isGenericPublicationAuthor(name: string): boolean {
  const key = normalizeKey(name);
  if (GENERIC_SET.has(key)) return true;
  if (key.startsWith("pdnadmin") || key === "pdnstaff" || key === "press_release") {
    return true;
  }
  return normalizeKey(resolveAuthorDisplayName(name)) === normalizeKey(PUBLICATION_NAME);
}

/** Returns null when the byline should be hidden on cards. */
export function getVisibleAuthorName(raw: string): string | null {
  if (!raw?.trim()) return null;
  if (isGenericPublicationAuthor(raw)) return null;
  const display = resolveAuthorDisplayName(raw);
  if (isGenericPublicationAuthor(display)) return null;
  return display;
}

/**
 * Returns possible `articles.author` raw values that might exist in Supabase.
 *
 * Why: older imports stored WordPress login-style authors (e.g. `harthwellc`)
 * while the UI often deals with the resolved display name (e.g. `Harthwell Capistrano`).
 * For hover-card previews we need to query by the raw values.
 */
export function getAuthorRawCandidates(input: string): string[] {
  const trimmed = input?.trim() ?? "";
  if (!trimmed) return [];

  const resolvedDisplay = resolveAuthorDisplayName(trimmed);
  const displayKey = normalizeKey(resolvedDisplay);

  const candidates = new Set<string>();

  // input itself + common casing variants
  candidates.add(trimmed);
  candidates.add(trimmed.toLowerCase());
  candidates.add(
    trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase(),
  );
  candidates.add(resolvedDisplay);

  // alias keys that map to this display name
  for (const [aliasKey, aliasValue] of Object.entries(authorConfig.aliases)) {
    if (normalizeKey(aliasValue) === displayKey) {
      candidates.add(aliasKey);
      candidates.add(aliasKey.toLowerCase());
      candidates.add(
        aliasKey.charAt(0).toUpperCase() + aliasKey.slice(1).toLowerCase(),
      );
    }
  }

  return [...candidates].filter(Boolean);
}
