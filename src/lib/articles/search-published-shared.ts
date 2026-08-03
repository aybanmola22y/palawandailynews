import { sanitizeSearchQuery } from "@/lib/security/safe-url";

/**
 * Lean archive search limits — keep free-tier Supabase egress small.
 * One page of title/meta rows only; never full article bodies.
 */
export const PUBLIC_SEARCH_PAGE_SIZE = 12;
/** Cap deep pagination so one session cannot walk the whole archive. */
export const PUBLIC_SEARCH_MAX_PAGE = 25;
export const PUBLIC_SEARCH_MIN_QUERY = 2;
export const PUBLIC_SEARCH_MAX_QUERY = 80;

export type PublishedSearchResult = {
  articles: import("@/types/article").Article[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

/** Strip ILIKE / PostgREST filter metacharacters. */
export function sanitizeArchiveSearchQuery(raw: string): string {
  return sanitizeSearchQuery(raw, PUBLIC_SEARCH_MAX_QUERY)
    .replace(/[%_\\,()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
