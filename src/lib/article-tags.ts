/** Parse comma- or pipe-separated tag text into a deduped list (max 30). */
export function parseTagsFromInput(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,|]/)
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ].slice(0, 30);
}
