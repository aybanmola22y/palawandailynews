import { revalidatePath } from "next/cache";

/** Bust Next.js / CDN cache for the public article list API after admin writes. */
export function revalidatePublicArticleSummaries() {
  revalidatePath("/api/articles/summaries");
}
