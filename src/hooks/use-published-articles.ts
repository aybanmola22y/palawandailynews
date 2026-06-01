import { useArticles } from "@/store/articles-context";

export function usePublishedArticles() {
  return useArticles().publishedArticles;
}
