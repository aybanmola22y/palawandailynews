import type { Article } from "@/types/article";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchPublishedSummaries } from "@/lib/articles/fetch-published-summaries";

const ADMIN_BOOTSTRAP_LIMIT = 500;

export async function loadAdminSummariesBootstrap(): Promise<Article[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];
  return fetchPublishedSummaries(client, {
    publishedOnly: false,
    includeTags: true,
    limit: ADMIN_BOOTSTRAP_LIMIT,
  });
}

export async function loadAdminSummariesFull(): Promise<Article[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];
  return fetchPublishedSummaries(client, {
    publishedOnly: false,
    includeTags: true,
  });
}
