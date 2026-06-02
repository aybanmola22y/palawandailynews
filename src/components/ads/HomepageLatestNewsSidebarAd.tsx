"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import type { Ad } from "@/store/ads-context";
import { useAds } from "@/store/ads-context";
import { AdUnit } from "./AdUnit";
import { cn } from "@/lib/utils";

function SidebarAdPlaceholder({ ad, className }: { ad?: Ad; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[520px] w-full flex-1 flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#D4D4D0] bg-[#F5F5F3] px-6 py-12 text-center dark:border-[#3A3A36] dark:bg-[#141413]",
        className,
      )}
      data-testid="homepage-latest-sidebar-ad-placeholder"
    >
      <Megaphone
        className="mb-3 h-6 w-6 text-muted-foreground/45"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Advertisement
      </p>
      <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-muted-foreground/75">
        Premium sidebar placement beside Latest News on the homepage.
      </p>
      <Link
        href="/advertise"
        className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-primary hover:underline"
      >
        Advertise with us →
      </Link>
      {ad && ad.status !== "Active" ? (
        <p className="mt-4 text-[10px] text-muted-foreground/90">
          Admin: set <strong>{ad.client}</strong> to Active in{" "}
          <Link href="/admin/ads" className="text-primary hover:underline">
            Advertisements
          </Link>
        </p>
      ) : null}
    </div>
  );
}

/** Vertical ad beside the homepage Latest News list (desktop right column). */
export function HomepageLatestNewsSidebarAd({ className }: { className?: string }) {
  const { getAdByPlacement } = useAds();
  const ad = getAdByPlacement("sidebar");
  const showLive = ad?.status === "Active" && Boolean(ad.image);

  return (
    <aside
      className={cn("flex min-w-0 flex-col", className)}
      aria-label="Homepage latest news sidebar advertisement"
    >
      {showLive && ad ? (
        <AdUnit
          ad={ad}
          aspectClass=""
          minHeightClass="min-h-[520px]"
          fillHeight
          wrapperClassName="h-full min-h-[520px] flex-1"
          testId="homepage-latest-sidebar-ad"
        />
      ) : (
        <SidebarAdPlaceholder ad={ad} className="flex-1" />
      )}
    </aside>
  );
}
