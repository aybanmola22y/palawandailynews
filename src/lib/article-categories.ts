import type { Article } from "@/types/article";
import { getPrimaryCategory } from "@/lib/site-articles";

/** Common categories for Palawan Daily News (site + WordPress imports). */
export const ADMIN_CATEGORY_PRESETS = [
  "Business",
  "City News",
  "Documentary",
  "Energy",
  "Environment",
  "Feature",
  "Legal",
  "Lifestyle",
  "News",
  "Opinion",
  "Politics",
  "Social Media",
  "Travel & Tourism",
] as const;

function titleCaseCategory(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word === "&") return word;
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Pick the option that matches `raw`, case-insensitive (for HTML select value). */
export function resolveCategoryForSelect(
  raw: string,
  options: string[],
): string {
  const primary = titleCaseCategory(getPrimaryCategory(raw));
  if (!primary) return "";

  const exact = options.find((o) => o === primary);
  if (exact) return exact;

  const ignoreCase = options.find(
    (o) => o.toLowerCase() === primary.toLowerCase(),
  );
  return ignoreCase ?? primary;
}

/** Sorted unique categories for admin dropdowns (presets + live data + current article). */
export function getArticleCategoryOptions(
  articles: Pick<Article, "category">[],
  selected?: string,
): string[] {
  const set = new Set<string>(ADMIN_CATEGORY_PRESETS);

  for (const article of articles) {
    const raw = article.category?.trim();
    if (!raw) continue;
    set.add(titleCaseCategory(getPrimaryCategory(raw)));
    for (const part of raw.split(",")) {
      const label = titleCaseCategory(getPrimaryCategory(part));
      if (label) set.add(label);
    }
  }

  const resolved = selected?.trim()
    ? resolveCategoryForSelect(selected, Array.from(set))
    : "";
  if (resolved) set.add(resolved);

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
