import type { Article } from "@/types/article";

const ADMIN_API_PATH = "/api/admin/articles/summaries";
const ADMIN_BOOTSTRAP_LIMIT = 500;

async function fetchAdminSummariesFromApi(
  options: { limit?: number; full?: boolean } = {},
): Promise<Article[]> {
  const params = new URLSearchParams();
  if (options.full) {
    params.set("full", "1");
  } else if (options.limit != null && options.limit > 0) {
    params.set("limit", String(options.limit));
  }

  const query = params.toString();
  const url = query ? `${ADMIN_API_PATH}?${query}` : ADMIN_API_PATH;

  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to load articles");
  }

  const data = (await res.json()) as Article[];
  if (!Array.isArray(data)) {
    throw new Error("Failed to load articles");
  }

  return data;
}

export async function loadAdminSummariesBootstrap(): Promise<Article[]> {
  return fetchAdminSummariesFromApi({ limit: ADMIN_BOOTSTRAP_LIMIT });
}

export async function loadAdminSummariesFull(): Promise<Article[]> {
  return fetchAdminSummariesFromApi({ full: true });
}
