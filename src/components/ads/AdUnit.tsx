"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Ad } from "@/store/ads-context";
import { useAds } from "@/store/ads-context";

type AdUnitProps = {
  ad: Ad;
  aspectClass?: string;
  minHeightClass?: string;
  wrapperClassName?: string;
  testId?: string;
};

export function AdUnit({
  ad,
  aspectClass = "aspect-[5/1]",
  minHeightClass = "min-h-[120px] sm:min-h-[160px]",
  wrapperClassName = "",
  testId,
}: AdUnitProps) {
  const { recordImpression, recordClick } = useAds();
  const impressionRecorded = useRef(false);

  useEffect(() => {
    if (ad.status === "Active" && !impressionRecorded.current) {
      impressionRecorded.current = true;
      recordImpression(ad.id);
    }
  }, [ad.id, ad.status, recordImpression]);

  if (ad.status !== "Active" || !ad.image) {
    return null;
  }

  const content = (
    <div className="relative w-full overflow-hidden rounded-sm border border-border bg-muted group">
      <div className={`${aspectClass} w-full ${minHeightClass}`}>
        <img
          src={ad.image}
          alt={ad.altText || `${ad.client} advertisement`}
          className="w-full h-full object-cover transition-opacity group-hover:opacity-95"
        />
      </div>
      <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/50 text-white text-[9px] uppercase tracking-[0.2em] font-bold">
        Advertisement
      </span>
    </div>
  );

  return (
    <aside
      className={wrapperClassName}
      aria-label="Sponsored content"
      data-testid={testId}
    >
      {ad.linkUrl ? (
        <Link
          href={ad.linkUrl}
          target={ad.linkUrl.startsWith("http") ? "_blank" : undefined}
          rel={ad.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}
          onClick={() => recordClick(ad.id)}
          className="block"
        >
          {content}
        </Link>
      ) : (
        content
      )}
      {ad.client && (
        <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-center">
          Sponsored by {ad.client}
        </p>
      )}
    </aside>
  );
}
