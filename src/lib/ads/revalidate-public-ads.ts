import { revalidatePath, revalidateTag } from "next/cache";

/** Bust public ads list cache after admin writes. */
export function revalidatePublicAds() {
  revalidateTag("ads");
  revalidatePath("/api/ads");
  revalidatePath("/");

  void notifyProductionAdsRevalidate();
}

async function notifyProductionAdsRevalidate() {
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
