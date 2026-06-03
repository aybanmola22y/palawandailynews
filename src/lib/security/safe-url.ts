/** Slug-style article ids (WordPress imports + CMS). */
const ARTICLE_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,240}$/;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const AUTHOR_SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;

export const DANGEROUS_PATH =
  /(?:\.\.\/|\.\.\\|%2e%2e|%252e|\/\/|\\|javascript:|data:|vbscript:|\x00|%00)/i;

const ALLOWED_ADMIN_QUERY_KEYS = new Set([
  "next",
  "step",
  "error",
  "required",
  "status",
  "q",
  "days",
]);

/**
 * Relative in-app path only — blocks open redirects and path traversal.
 */
export function isSafeInternalPath(
  path: string,
  options: { adminOnly?: boolean } = {},
): boolean {
  const raw = path.trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return false;
  if (DANGEROUS_PATH.test(raw)) return false;
  if (raw.includes("\\") || raw.includes("\0")) return false;

  try {
    const decoded = decodeURIComponent(raw);
    if (DANGEROUS_PATH.test(decoded) || decoded.includes("\0")) return false;
  } catch {
    return false;
  }

  if (options.adminOnly && !raw.startsWith("/admin")) return false;
  return true;
}

export function sanitizeRedirectPath(
  next: string | null | undefined,
  fallback: string,
  options: { adminOnly?: boolean } = {},
): string {
  if (next && isSafeInternalPath(next, options)) return next;
  return fallback;
}

export function isValidArticleId(id: string): boolean {
  return ARTICLE_ID_RE.test(id.trim());
}

export function isValidUuid(id: string): boolean {
  return UUID_RE.test(id.trim());
}

export function isValidAuthorSlug(slug: string): boolean {
  return AUTHOR_SLUG_RE.test(slug.trim().toLowerCase());
}

export function clampInt(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = typeof value === "number" ? value : Number(String(value ?? ""));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Search box / ?q= — length limit, no control chars. */
export function sanitizeSearchQuery(
  query: string,
  maxLength = 200,
): string {
  return query
    .replace(/[\0-\x1f\x7f]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function hasDisallowedQueryKeys(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    if (!ALLOWED_ADMIN_QUERY_KEYS.has(key.toLowerCase())) {
      return true;
    }
  }
  return false;
}
