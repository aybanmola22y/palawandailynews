import type { Article, ArticleInsert, ArticleUpdate } from "@/types/article";

export interface ArticlesRepository {
  /** Full rows including `content` — avoid on large archives. */
  list(): Promise<Article[]>;
  /** All statuses, no body HTML — admin lists and dashboard. */
  listAdminSummaries(): Promise<Article[]>;
  /** List without body HTML — much faster for public browsing. */
  listSummaries(): Promise<Article[]>;
  getById(id: string): Promise<Article | null>;
  listByIds(ids: string[]): Promise<Article[]>;
  create(article: ArticleInsert): Promise<Article>;
  update(id: string, changes: ArticleUpdate): Promise<Article>;
  delete(id: string): Promise<void>;
}
