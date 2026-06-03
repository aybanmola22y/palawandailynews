"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import type { Ad } from "@/store/ads-context";
import { hasCustomAdImage, shouldShowLiveAd, useAds } from "@/store/ads-context";
import { AdUnit } from "./AdUnit";

function HomepageMidAdPlaceholder({ ad }: { ad?: Ad }) {
  return (
    <div
      className="flex min-h-[120px] flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#D4D4D0] bg-[#F5F5F3] px-6 py-10 text-center dark:border-[#3A3A36] dark:bg-[#141413] sm:min-h-[160px]"
      data-testid="homepage-mid-banner-placeholder"
    >
      <Megaphone
        className="mb-3 h-6 w-6 text-muted-foreground/45"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Homepage advertisement space
      </p>
      <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-muted-foreground/75">
        Full-width placement below Legal Notices and Lifestyle on the homepage.
      </p>
      {ad ? (
        <p className="mt-4 text-[11px] text-muted-foreground/90">
          Admin: <span className="font-medium text-foreground">{ad.client}</span> ·{" "}
          <span className="uppercase">{ad.status}</span>
          {ad.status !== "Active" || !hasCustomAdImage(ad.placement, ad.image) ? (
            <>
              {" "}
              — set to <strong>Active</strong> and upload a banner in{" "}
              <Link href="/admin/ads" className="text-primary hover:underline">
                Advertisements
              </Link>{" "}
              to replace this placeholder.
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export function HomepageMidBanner() {
  const { getAdByPlacement } = useAds();
  const ad = getAdByPlacement("homepage-mid");
  const showLive = ad ? shouldShowLiveAd(ad) : false;

  if (!ad) return null;

  return (
    <section className="mt-12 pt-12 border-t border-border">
      {showLive ? (
        <AdUnit
          ad={ad}
          aspectClass="aspect-[5/1]"
          minHeightClass="min-h-[120px] sm:min-h-[160px]"
          testId="homepage-mid-banner"
        />
      ) : (
        <HomepageMidAdPlaceholder ad={ad} />
      )}
    </section>
  );
}
