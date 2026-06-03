import type { Article } from "@/types/article";

/** Draft created in the admin CMS — excludes imported WordPress drafts. */
export function isCmsDraft(
  article: Pick<Article, "status" | "cmsOrigin">,
): boolean {
  return article.status === "Draft" && article.cmsOrigin === true;
}
