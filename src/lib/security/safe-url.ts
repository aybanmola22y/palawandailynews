/**
 * Slug-style article ids (WordPress imports + CMS).
 * Allows letters, numbers, `_`, `-`, currency symbols (₱), and literal
 * `%XX` sequences (some legacy imports stored encoded pesos as text).
 */
const ARTICLE_ID_RE =
  /^(?:[\p{L}\p{N}\p{Sc}]|%[0-9A-Fa-f]{2})(?:[\p{L}\p{N}_\-\p{Sc}]|%[0-9A-Fa-f]{2}){0,300}$/u;

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
 * Next may leave path segments percent-encoded (or double-encoded).
 * Decode until stable for matching / validation.
 */
export function decodeRouteParam(raw: string): string {
  let value = raw.trim();
  for (let i = 0; i < 3; i++) {
    if (!/%[0-9a-fA-F]{2}/.test(value)) break;
    try {
      const next = decodeURIComponent(value);
      if (next === value) break;
      value = next;
    } catch {
      break;
    }
  }
  return value;
}

/**
 * Legacy imports stored `₱` as the literal text `%e2%82%b1` in `articles.id`.
 * Browsers decode that sequence in the path to `₱`, so lookups must try both.
 */
export function articleIdLookupCandidates(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const out = new Set<string>();
  const add = (value: string) => {
    const v = value.trim();
    if (!v) return;
    out.add(v);
    if (v.startsWith("wp-")) out.add(v.slice(3));
  };

  add(trimmed);
  try {
    add(decodeURIComponent(trimmed));
  } catch {
    /* ignore malformed encoding */
  }
  add(decodeRouteParam(trimmed));

  for (const candidate of [...out]) {
    if (/[^\x00-\x7F]/.test(candidate)) {
      add(
        candidate.replace(/[^\x00-\x7F]/g, (ch) =>
          encodeURIComponent(ch).toLowerCase(),
        ),
      );
      add(
        candidate.replace(/[^\x00-\x7F]/g, (ch) =>
          encodeURIComponent(ch).toUpperCase(),
        ),
      );
    }
  }

  return [...out];
}

/** Decode route param and strip legacy `wp-` prefix used in old links. */
export function normalizeArticleId(raw: string): string {
  const candidates = articleIdLookupCandidates(raw);
  return candidates[0] ?? "";
}

/** In-app article path — encodes so literal `%` in legacy ids is not re-decoded by the browser. */
export function articleHref(id: string): string {
  return `/article/${encodeURIComponent(id)}`;
}

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
  return articleIdLookupCandidates(id).some((candidate) =>
    ARTICLE_ID_RE.test(candidate),
  );
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
