/**
 * Keep the public site on the small cached summary slice by default.
 *
 * Pulling the full archive can return thousands of rows and quickly burn through
 * Supabase's 5 GB free egress quota. Add routes here only after they use
 * server-side pagination/search or when a one-off full archive download is
 * intentionally acceptable.
 */
const FULL_ARCHIVE_PREFIXES = [] as const;

export function pathnameNeedsFullArchive(pathname: string): boolean {
  const path = pathname.split("?")[0] ?? pathname;
  return FULL_ARCHIVE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
