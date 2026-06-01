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
  try {
    const res = await fetch(API_PATH, {
      method: "GET",
      credentials: "same-origin",
    });
    if (res.ok) {
      const data = (await res.json()) as Article[];
      if (Array.isArray(data) && data.length) return data;
    }
  } catch {
    /* fall through to direct Supabase */
  }

  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error("Unable to load articles");
  }

  return fetchPublishedSummaries(client, { publishedOnly: true });
}
