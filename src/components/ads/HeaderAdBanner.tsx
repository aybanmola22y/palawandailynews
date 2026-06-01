"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import type { Ad } from "@/store/ads-context";
import { useAds } from "@/store/ads-context";
import { AdUnit } from "./AdUnit";

function HeaderAdPlaceholder({ ad }: { ad?: Ad }) {
  return (
    <div
      className="flex min-h-[100px] flex-col items-center justify-center rounded-md border-2 border-dashed border-[#D4D4D0] bg-[#F5F5F3] px-6 py-8 text-center dark:border-[#3A3A36] dark:bg-[#141413] sm:min-h-[140px]"
      data-testid="header-ad-placeholder"
    >
      <Megaphone
        className="mb-3 h-6 w-6 text-muted-foreground/45"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Header advertisement space
      </p>
      <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-muted-foreground/75">
        Get your brand in front of thousands of daily readers.
      </p>
      {ad ? (
        <p className="mt-4 text-[11px] text-muted-foreground/90">
          Admin: <span className="font-medium text-foreground">{ad.client}</span> ·{" "}
          <span className="uppercase">{ad.status}</span>
          {ad.status !== "Active" ? (
            <>
              {" "}
              — set to <strong>Active</strong> in{" "}
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

export function HeaderAdBanner() {
  const { getAdByPlacement } = useAds();
  const ad = getAdByPlacement("header-banner");
  const showLive = ad?.status === "Active" && Boolean(ad.image);

  return (
    <section
      className="border-b border-border bg-[#FAFAF8] dark:bg-[#111110]"
      aria-label="Header advertisement"
    >
      <div className="editorial-container pt-2 pb-4 sm:pt-3 sm:pb-5">
        {showLive && ad ? (
          <AdUnit
            ad={ad}
            aspectClass="aspect-[970/250]"
            minHeightClass="min-h-[80px] sm:min-h-[120px] lg:min-h-[140px]"
            testId="header-banner"
          />
        ) : (
          <HeaderAdPlaceholder ad={ad} />
        )}
      </div>
    </section>
  );
}
