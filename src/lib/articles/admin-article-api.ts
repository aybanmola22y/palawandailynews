import type { Article, ArticleInsert, ArticleUpdate } from "@/types/article";

async function parseError(res: Response) {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function fetchAdminArticle(id: string): Promise<Article | null> {
  const res = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as Article;
}

const SERVICE_ROLE_MSG =
  "Cannot save to Supabase: add SUPABASE_SERVICE_ROLE_KEY to .env and restart the dev server.";

export async function createAdminArticle(article: ArticleInsert): Promise<Article> {
  const res = await fetch("/api/admin/articles", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(article),
  });
  if (res.status === 503) {
    throw new Error((await parseError(res)) || SERVICE_ROLE_MSG);
  }
  if (!res.ok) throw new Error(await parseError(res));
  const saved = (await res.json()) as Article;
  if (!saved?.id?.trim()) {
    throw new Error("Article was not saved — server returned no id.");
  }
  return saved;
}

export async function patchAdminArticle(
  id: string,
  changes: ArticleUpdate,
): Promise<Article> {
  const res = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as Article;
}

export async function deleteAdminArticle(id: string): Promise<void> {
  const res = await fetch(`/api/admin/articles/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
}
