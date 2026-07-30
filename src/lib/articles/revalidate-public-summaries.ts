import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT } from "@/lib/articles/load-public-summaries";

/** Bust Next.js data cache for the public article list API after admin writes. */
export function revalidatePublicArticleSummaries() {
  revalidateTag("article-summaries");
  revalidateTag("article-opinion");
  revalidatePath("/api/articles/summaries");
  revalidatePath(
    `/api/articles/summaries?limit=${PUBLIC_SUMMARIES_BOOTSTRAP_LIMIT}`,
  );
  revalidatePath("/api/articles/opinion");
  revalidatePath("/");
  revalidatePath("/latest");
  revalidatePath("/opinion");

  // Publishing from localhost only clears the local Next cache. Also ping
  // production so palawandailynews.vercel.app drops its CDN / ISR list.
  void notifyProductionArticleRevalidate();
}

async function notifyProductionArticleRevalidate() {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  const targets = [
    process.env.PRODUCTION_REVALIDATE_URL?.trim(),
    "https://palawandailynews.vercel.app/api/revalidate/articles",
  ].filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index);

  if (!secret || targets.length === 0) return;

  await Promise.allSettled(
    targets.map((url) =>
      fetch(url, {
        method: "POST",
        headers: {
          "x-revalidate-secret": secret,
          authorization: `Bearer ${secret}`,
        },
        cache: "no-store",
      }).catch(() => null),
    ),
  );
}
