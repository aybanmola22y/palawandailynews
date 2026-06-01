"use client";

import { useAds } from "@/store/ads-context";
import { AdUnit } from "./AdUnit";

export function HomepageMidBanner() {
  const { getAdByPlacement } = useAds();
  const ad = getAdByPlacement("homepage-mid");

  if (!ad) return null;

  return (
    <section className="mt-12 pt-12 border-t border-border">
      <AdUnit
        ad={ad}
        aspectClass="aspect-[5/1]"
        minHeightClass="min-h-[120px] sm:min-h-[160px]"
        testId="homepage-mid-banner"
      />
    </section>
  );
}
