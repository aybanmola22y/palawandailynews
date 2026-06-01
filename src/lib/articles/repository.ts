import type { Article, ArticleInsert, ArticleUpdate } from "@/types/article";

export interface ArticlesRepository {
  /** Full rows including `content` (admin, editors). */
  list(): Promise<Article[]>;
  /** List without body HTML — much faster for public browsing. */
  listSummaries(): Promise<Article[]>;
  getById(id: string): Promise<Article | null>;
  listByIds(ids: string[]): Promise<Article[]>;
  create(article: ArticleInsert): Promise<Article>;
  update(id: string, changes: ArticleUpdate): Promise<Article>;
  delete(id: string): Promise<void>;
}
