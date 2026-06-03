import type { StaffProfile } from "@/store/staff-context";

/** Staff names for the article author field, plus the current value if not in staff. */
export function getArticleAuthorOptions(
  staff: StaffProfile[],
  currentAuthor?: string,
): string[] {
  const seen = new Set<string>();
  const options: string[] = [];

  for (const member of staff) {
    const name = member.name.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push(name);
  }

  options.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const current = currentAuthor?.trim();
  if (current) {
    const key = current.toLowerCase();
    if (!seen.has(key)) {
      options.unshift(current);
    }
  }

  return options;
}
