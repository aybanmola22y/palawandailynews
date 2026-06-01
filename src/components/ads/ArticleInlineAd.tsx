"use client";

import { useAds } from "@/store/ads-context";
import { AdUnit } from "./AdUnit";

export function ArticleInlineAd() {
  const { getAdByPlacement } = useAds();
  const ad = getAdByPlacement("article-inline");

  if (!ad) return null;

  return (
    <AdUnit
      ad={ad}
      aspectClass="aspect-[16/9]"
      minHeightClass="min-h-[180px] sm:min-h-[220px]"
      wrapperClassName="my-12"
      testId="article-inline-ad"
    />
  );
}
