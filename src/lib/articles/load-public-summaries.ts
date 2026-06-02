import type { Article } from "@/types/article";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchPublishedSummaries } from "@/lib/articles/fetch-published-summaries";

const API_PATH = "/api/articles/summaries";

export async function loadPublicSummariesBootstrap(): Promise<Article[]> {
  const client = getSupabaseBrowserClient();
  if (client) {
    return fetchPublishedSummaries(client, {
      publishedOnly: true,
      limit: 400,
    });
  }
  return [];
}

export async function loadPublicSummariesFull(): Promise<Article[]> {
  const client = getSupabaseBrowserClient();
  if (client) {
    return fetchPublishedSummaries(client, { publishedOnly: true });
  }

  try {
    const res = await fetch(API_PATH, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as Article[];
      if (Array.isArray(data)) return data;
    }
  } catch {
    /* fall through */
  }

  throw new Error("Unable to load articles");
}
