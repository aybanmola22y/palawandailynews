"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import type { Ad } from "@/store/ads-context";
import { shouldShowLiveAd, useAds } from "@/store/ads-context";
import { AdUnit } from "./AdUnit";

function ArticleInlineAdPlaceholder({ ad }: { ad?: Ad }) {
  const needsUpload = ad?.status === "Active";

  return (
    <div
      className="flex min-h-[180px] flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#D4D4D0] bg-[#F5F5F3] px-6 py-10 text-center dark:border-[#3A3A36] dark:bg-[#141413] sm:min-h-[220px]"
      data-testid="article-inline-ad-placeholder"
    >
      <Megaphone
        className="mb-3 h-6 w-6 text-muted-foreground/45"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Article advertisement space
      </p>
      <p className="mt-1.5 max-w-md text-[12px] leading-relaxed text-muted-foreground/75">
        Reserved placement below the article tags — upload a banner in admin to go live.
      </p>
      {ad ? (
        <p className="mt-4 text-[11px] text-muted-foreground/90">
          Admin: <span className="font-medium text-foreground">{ad.client}</span> ·{" "}
          <span className="uppercase">{ad.status}</span>
          {needsUpload ? (
            <>
              {" "}
              — upload an image in{" "}
              <Link href="/admin/ads" className="text-primary hover:underline">
                Advertisements
              </Link>{" "}
              (In-Article) to replace this space.
            </>
          ) : (
            <>
              {" "}
              — set to <strong>Active</strong> and upload a banner in{" "}
              <Link href="/admin/ads" className="text-primary hover:underline">
                Advertisements
              </Link>
              .
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

export function ArticleInlineAd() {
  const { getAdByPlacement } = useAds();
  const ad = getAdByPlacement("article-inline");
  const showLive = Boolean(ad && shouldShowLiveAd(ad));

  return (
    <section
      className="mt-10 border-t border-border pt-10 mb-12"
      aria-label="Article advertisement"
    >
      {showLive && ad ? (
        <AdUnit
          ad={ad}
          aspectClass="aspect-[16/9]"
          minHeightClass="min-h-[180px] sm:min-h-[220px]"
          wrapperClassName=""
          testId="article-inline-ad"
        />
      ) : (
        <ArticleInlineAdPlaceholder ad={ad} />
      )}
    </section>
  );
}
