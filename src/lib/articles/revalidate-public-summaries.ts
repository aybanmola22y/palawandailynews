import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT } from "@/lib/articles/load-public-summaries";

/** Bust Next.js / CDN cache for the public article list API after admin writes. */
export function revalidatePublicArticleSummaries() {
  revalidateTag("article-summaries");
  revalidatePath("/api/articles/summaries");
  revalidatePath(
    `/api/articles/summaries?limit=${PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT}`,
  );
}
