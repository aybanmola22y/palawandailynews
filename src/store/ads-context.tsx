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

const STORAGE_KEY = "pdn_ads";
const STORAGE_VERSION = "v4";
const VERSION_KEY = "pdn_ads_version";

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

function defaultImage(placement: AdPlacement): string {
  if (placement === "header-banner") return "/images/header-ad-banner.svg";
  if (placement === "homepage-mid") return "/images/home-ad-banner.svg";
  if (placement === "article-inline") return "/images/article-ad-banner.svg";
  if (placement === "sidebar") return "/images/sidebar-ad-banner.svg";
  return "";
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

function normalizeAd(ad: Ad): Ad {
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
    image: ad.image || defaultImage(placement),
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
    image: defaultImage(placement),
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

function mergeWithSeed(stored: Ad[]): Ad[] {
  const merged: Ad[] = [];
  const seen = new Set<AdPlacement>();

  for (const ad of stored.map(normalizeAd)) {
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

function loadAds(): Ad[] {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    const stored = localStorage.getItem(STORAGE_KEY);

    if (version !== STORAGE_VERSION) {
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      if (stored) {
        const parsed = JSON.parse(stored) as Ad[];
        const merged = mergeWithSeed(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
      return seedAds;
    }

    if (stored) {
      return mergeWithSeed(JSON.parse(stored) as Ad[]);
    }
  } catch {
    /* ignore */
  }
  return seedAds;
}

function saveAds(ads: Ad[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ads));
  } catch {
    /* ignore */
  }
}

interface AdsContextType {
  ads: Ad[];
  getAdByPlacement: (placement: AdPlacement) => Ad | undefined;
  updateAd: (id: string, changes: Partial<Ad>) => void;
  recordImpression: (id: string) => void;
  recordClick: (id: string) => void;
}

const AdsContext = createContext<AdsContextType | null>(null);

export function AdsProvider({ children }: { children: ReactNode }) {
  const [ads, setAds] = useState<Ad[]>(seedAds);
  const hydrated = useRef(false);

  useEffect(() => {
    setAds(loadAds());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveAds(ads);
  }, [ads]);

  function getAdByPlacement(placement: AdPlacement) {
    let ad = ads.find((a) => a.placement === placement);

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

  function updateAd(id: string, changes: Partial<Ad>) {
    setAds((prev) =>
      prev.map((a) => (a.id === id ? normalizeAd({ ...a, ...changes }) : a)),
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
      value={{ ads, getAdByPlacement, updateAd, recordImpression, recordClick }}
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
