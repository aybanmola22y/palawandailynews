export type ArticleStatus = "Published" | "Draft" | "Review";

/** App-level article (camelCase). `image` is a Hostinger or CDN URL, not a file blob. */
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  tags: string[];
  date: string;
  readingTime: string;
  image: string;
  isBreaking: boolean;
  status: ArticleStatus;
  updatedAt?: number;
  /** Original WordPress post id (imports only). */
  legacyWpId?: number;
}

export type ArticleInsert = Omit<Article, "id" | "updatedAt"> & {
  id?: string;
};

export type ArticleUpdate = Partial<Omit<Article, "id">>;
