"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { ads as initialAds } from "@/data/ads";
import { patchAdminAd } from "@/lib/ads/admin-ad-api";

export type AdStatus = "Active" | "Scheduled" | "Inactive";

export type AdPlacement =
  | "header-banner"
  | "homepage-mid"
  | "article-inline"
  | "sidebar"
  | (string & {});

export interface Ad {
  id: string;
  client: string;
  placement: AdPlacement;
  placementLabel: string;
  status: AdStatus;
  image: string;
  linkUrl: string;
  altText: string;
  impressions: number;
  clicks: number;
}

function mapPlacement(label: string, placement?: AdPlacement): AdPlacement {
  if (placement === "header-banner") return "header-banner";
  if (placement === "sidebar") return "sidebar";
  if (placement === "homepage-mid") return "homepage-mid";
  if (placement === "article-inline") return "article-inline";
  if (label === "Header Banner") return "header-banner";
  if (label === "Sidebar" || label === "Homepage Latest News") return "sidebar";
  if (label === "Homepage Banner") return "homepage-mid";
  if (label === "In-Article") return "article-inline";
  return "sidebar";
}

export function getDefaultAdImage(placement: AdPlacement): string {
  if (placement === "header-banner") return "/images/header-ad-banner.svg";
  if (placement === "homepage-mid") return "/images/home-ad-banner.svg";
  if (placement === "article-inline") return "/images/article-ad-banner.svg";
  if (placement === "sidebar") return "/images/sidebar-ad-banner.svg";
  return "";
}

/** True when a real uploaded/URL image is set (not cleared, not the stock placeholder). */
export function hasCustomAdImage(placement: AdPlacement, image: string): boolean {
  const trimmed = image.trim();
  return Boolean(trimmed) && trimmed !== getDefaultAdImage(placement);
}

/** Whether a live sponsored unit should render on the public site. */
export function shouldShowLiveAd(ad: Pick<Ad, "placement" | "image" | "status">): boolean {
  if (ad.status !== "Active") return false;
  return hasCustomAdImage(ad.placement, ad.image);
}

function resolveAdImage(image: string | undefined, placement: AdPlacement): string {
  if (image === "") return "";
  if (image) return image;
  return getDefaultAdImage(placement);
}

function defaultAlt(placement: AdPlacement, client: string): string {
  if (
    placement === "header-banner" ||
    placement === "homepage-mid" ||
    placement === "article-inline" ||
    placement === "sidebar"
  ) {
    return `Advertisement — ${client}`;
  }
  return client;
}

export function normalizeAd(ad: Ad): Ad {
  const placement = mapPlacement(ad.placementLabel, ad.placement);
  const placementLabel =
    placement === "header-banner"
      ? "Header Banner"
      : placement === "sidebar"
        ? "Homepage Latest News"
        : ad.placementLabel;

  return {
    ...ad,
    placement,
    placementLabel,
    image: resolveAdImage(ad.image, placement),
    altText: ad.altText || defaultAlt(placement, ad.client),
    linkUrl:
      ad.linkUrl ||
      (placement === "header-banner" ||
      placement === "homepage-mid" ||
      placement === "article-inline" ||
      placement === "sidebar"
        ? "/advertise"
        : ""),
  };
}

const seedAds: Ad[] = initialAds.map((ad) => {
  const placement = mapPlacement(ad.placement);
  return normalizeAd({
    id: ad.id,
    client: ad.client,
    placement,
    placementLabel: ad.placement,
    status:
      ad.status === "Active"
        ? "Active"
        : ad.status === "Scheduled"
          ? "Scheduled"
          : "Inactive",
    image: getDefaultAdImage(placement),
    linkUrl:
      placement === "homepage-mid" ||
      placement === "article-inline" ||
      placement === "header-banner" ||
      placement === "sidebar"
        ? "/advertise"
        : "",
    altText: defaultAlt(placement, ad.client),
    impressions: ad.impressions,
    clicks: ad.clicks,
  });
});

function mergeWithSeed(remote: Ad[]): Ad[] {
  const merged: Ad[] = [];
  const seen = new Set<AdPlacement>();

  for (const ad of remote.map(normalizeAd)) {
    if (seen.has(ad.placement)) continue;
    seen.add(ad.placement);
    merged.push(ad);
  }

  for (const seed of seedAds) {
    if (!merged.some((a) => a.placement === seed.placement)) {
      merged.push(seed);
    }
  }

  return merged;
}

function clearLegacyAdStorage() {
  try {
    localStorage.removeItem("pdn_ads");
    localStorage.removeItem("pdn_ads_version");
  } catch {
    /* ignore */
  }
}

interface AdsContextType {
  ads: Ad[];
  adsLoading: boolean;
  adsError: string | null;
  getAdByPlacement: (placement: AdPlacement) => Ad | undefined;
  updateAd: (id: string, changes: Partial<Ad>) => Promise<void>;
  recordImpression: (id: string) => void;
  recordClick: (id: string) => void;
  refreshAds: () => Promise<void>;
}

const AdsContext = createContext<AdsContextType | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const [ads, setAds] = useState<Ad[]>(seedAds);
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsError, setAdsError] = useState<string | null>(null);

  const refreshAds = async () => {
    clearLegacyAdStorage();
    try {
      const res = await fetch("/api/ads", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? res.statusText);
      }
      const remote = (await res.json()) as Ad[];
      setAds(mergeWithSeed(remote));
      setAdsError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load advertisements";
      setAdsError(message);
      setAds(mergeWithSeed([]));
    } finally {
      setAdsLoading(false);
    }
  };

  useEffect(() => {
    void refreshAds();
  }, []);

  function getAdByPlacement(placement: AdPlacement) {
    let ad = ads.find((a) => a.placement === placement);

    if (!ad && placement === "article-inline") {
      ad = ads.find(
        (a) =>
          a.placementLabel === "In-Article" ||
          a.placementLabel.toLowerCase().includes("in-article"),
      );
    }

    if (!ad && placement === "header-banner") {
      ad = ads.find(
        (a) =>
          a.placement === "sidebar" ||
          a.placementLabel === "Sidebar" ||
          a.placementLabel === "Header Banner",
      );
    }

    return ad ? normalizeAd(ad) : undefined;
  }

  async function updateAd(id: string, changes: Partial<Ad>) {
    const saved = await patchAdminAd(id, changes);
    setAds((prev) =>
      prev.map((a) => (a.id === id ? normalizeAd(saved) : a)),
    );
  }

  function recordImpression(id: string) {
    setAds((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, impressions: a.impressions + 1 } : a,
      ),
    );
  }

  function recordClick(id: string) {
    setAds((prev) =>
      prev.map((a) => (a.id === id ? { ...a, clicks: a.clicks + 1 } : a)),
    );
  }

  return (
    <AdsContext.Provider
      value={{
        ads,
        adsLoading,
        adsError,
        getAdByPlacement,
        updateAd,
        recordImpression,
        recordClick,
        refreshAds,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error("useAds must be used inside AdsProvider");
  return ctx;
}
