import type { Ad, AdStatus } from "@/store/ads-context";
import type { AdRow } from "@/lib/supabase/database.types";

const STATUSES: AdStatus[] = ["Active", "Scheduled", "Inactive"];

function normalizeStatus(value: string): AdStatus {
  return STATUSES.includes(value as AdStatus) ? (value as AdStatus) : "Inactive";
}

export function rowToAd(row: AdRow): Ad {
  return {
    id: row.id,
    client: row.client,
    placement: row.placement,
    placementLabel: row.placement_label,
    status: normalizeStatus(row.status),
    image: row.image_url ?? "",
    linkUrl: row.link_url ?? "",
    altText: row.alt_text ?? "",
    impressions: row.impressions ?? 0,
    clicks: row.clicks ?? 0,
  };
}

export function adChangesToRow(changes: Partial<Ad>): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (changes.client !== undefined) patch.client = changes.client;
  if (changes.placement !== undefined) patch.placement = changes.placement;
  if (changes.placementLabel !== undefined) {
    patch.placement_label = changes.placementLabel;
  }
  if (changes.status !== undefined) patch.status = changes.status;
  if (changes.image !== undefined) patch.image_url = changes.image;
  if (changes.linkUrl !== undefined) patch.link_url = changes.linkUrl;
  if (changes.altText !== undefined) patch.alt_text = changes.altText;
  if (changes.impressions !== undefined) patch.impressions = changes.impressions;
  if (changes.clicks !== undefined) patch.clicks = changes.clicks;

  return patch;
}
