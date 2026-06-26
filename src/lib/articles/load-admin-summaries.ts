import type { Article } from "@/types/article";

const ADMIN_API_PATH = "/api/admin/articles/summaries";
const ADMIN_BOOTSTRAP_LIMIT = 500;

async function fetchAdminSummariesFromApi(limit?: number): Promise<Article[]> {
  const url =
    limit != null && limit > 0
      ? `${ADMIN_API_PATH}?limit=${limit}`
      : ADMIN_API_PATH;

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
  return fetchAdminSummariesFromApi(ADMIN_BOOTSTRAP_LIMIT);
}

export async function loadAdminSummariesFull(): Promise<Article[]> {
  return fetchAdminSummariesFromApi();
}
