"use client";



import { useEffect, useRef } from "react";

import Link from "next/link";

import type { Ad } from "@/store/ads-context";

import { shouldShowLiveAd, useAds } from "@/store/ads-context";

import { cn } from "@/lib/utils";



type AdUnitProps = {

  ad: Ad;

  aspectClass?: string;

  minHeightClass?: string;

  wrapperClassName?: string;

  imageFit?: "cover" | "contain";

  /** Stretch to fill a tall sidebar column (homepage Latest News). */

  fillHeight?: boolean;

  testId?: string;

};



export function AdUnit({

  ad,

  aspectClass = "aspect-[5/1]",

  minHeightClass = "min-h-[120px] sm:min-h-[160px]",

  wrapperClassName = "",

  imageFit = "cover",

  fillHeight = false,

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



  if (!shouldShowLiveAd(ad)) {
    return null;
  }



  const content = (

    <div

      className={cn(

        "relative w-full overflow-hidden rounded-sm border border-border bg-muted group",

        fillHeight && "h-full min-h-0 flex-1",

      )}

    >

      <div

        className={cn(

          "w-full",

          aspectClass,

          minHeightClass,

          fillHeight && "h-full min-h-0 flex-1",

        )}

      >

        <img

          src={ad.image}

          alt={ad.altText || `${ad.client} advertisement`}

          className={cn(

            "h-full w-full transition-opacity group-hover:opacity-95",

            imageFit === "contain" ? "object-contain" : "object-cover",

          )}

        />

      </div>

      <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/50 text-white text-[9px] uppercase tracking-[0.2em] font-bold">

        Advertisement

      </span>

    </div>

  );



  const linkClass = cn("block", fillHeight && "flex h-full min-h-0 flex-1 flex-col");



  return (

    <aside

      className={cn(wrapperClassName, fillHeight && "flex min-h-0 flex-1 flex-col")}

      aria-label="Sponsored content"

      data-testid={testId}

    >

      {ad.linkUrl ? (

        <Link

          href={ad.linkUrl}

          target={ad.linkUrl.startsWith("http") ? "_blank" : undefined}

          rel={ad.linkUrl.startsWith("http") ? "noopener noreferrer" : undefined}

          onClick={() => recordClick(ad.id)}

          className={linkClass}

        >

          {content}

        </Link>

      ) : (

        <div className={linkClass}>{content}</div>

      )}

      {ad.client && (

        <p className="mt-2 shrink-0 text-[10px] uppercase tracking-[0.15em] text-muted-foreground text-center">

          Sponsored by {ad.client}

        </p>

      )}

    </aside>

  );

}


