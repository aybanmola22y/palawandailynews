"use client";

import Link from "next/link";
import { useState, useRef, DragEvent } from "react";
import { useAds, Ad, AdStatus } from "@/store/ads-context";
import { Upload, Link as LinkIcon, X, Save, ExternalLink } from "lucide-react";

const STATUSES: AdStatus[] = ["Active", "Scheduled", "Inactive"];

function AdEditor({
  ad,
  onSave,
  description,
  recommendedSize,
  previewHref,
}: {
  ad: Ad;
  onSave: (changes: Partial<Ad>) => void;
  description: string;
  recommendedSize: string;
  previewHref?: string;
}) {
  const [form, setForm] = useState({
    client: ad.client,
    status: ad.status,
    image: ad.image,
    linkUrl: ad.linkUrl,
    altText: ad.altText,
  });
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [dragging, setDragging] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) =>
      setForm((prev) => ({ ...prev, image: e.target?.result as string }));
    reader.readAsDataURL(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleSave() {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white dark:bg-[#1A1A18] border border-border flex flex-col">
      <div className="p-6 border-b border-border flex justify-between items-start bg-[#FAFAF8] dark:bg-[#111111]">
        <div className="flex flex-col max-w-xl">
          <h3 className="font-serif text-[22px] font-bold">{ad.placementLabel}</h3>
          <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
          <span className="text-[11px] text-muted-foreground uppercase tracking-widest mt-2">
            Recommended: {recommendedSize}
          </span>
          {previewHref ? (
            <Link
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-bold uppercase tracking-wider text-primary hover:underline"
            >
              View on homepage
              <ExternalLink className="h-3 w-3" />
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saved && (
            <span className="text-[12px] text-[#008A45] font-medium">Saved!</span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#C41E3A] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-widest hover:bg-[#A01830] transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Client / Sponsor
            </label>
            <input
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              className="input"
              placeholder="Company name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as AdStatus })
              }
              className="input"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Only <strong>Active</strong> ads appear on the site.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Click-through URL
            </label>
            <input
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
              className="input"
              placeholder="/advertise or https://..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Alt text
            </label>
            <input
              value={form.altText}
              onChange={(e) => setForm({ ...form, altText: e.target.value })}
              className="input"
              placeholder="Describe the ad for accessibility"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-border">
            <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              Banner image
            </label>
            <div className="flex border border-border">
              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  imageTab === "upload"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="w-3 h-3" /> Upload
              </button>
              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold uppercase tracking-wider border-l border-border transition-colors ${
                  imageTab === "url"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LinkIcon className="w-3 h-3" /> URL
              </button>
            </div>

            {imageTab === "upload" && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFileChange}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed cursor-pointer transition-colors ${
                    dragging
                      ? "border-[#C41E3A] bg-[#C41E3A]/5"
                      : "border-border hover:border-foreground hover:bg-muted/40"
                  }`}
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[12px] text-muted-foreground">
                    Click or drag an image here
                  </span>
                </div>
              </>
            )}

            {imageTab === "url" && (
              <input
                value={form.image.startsWith("data:") ? "" : form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="input text-[12px]"
                placeholder="/images/home-ad-banner.svg or https://..."
              />
            )}

            {form.image && (
              <button
                type="button"
                onClick={() => setForm({ ...form, image: "" })}
                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-[#C41E3A] self-start"
              >
                <X className="w-3 h-3" /> Remove image
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
            Live preview
          </span>
          <div className="border border-border overflow-hidden">
            {form.image ? (
              <div className="aspect-[5/1] min-h-[100px] bg-muted">
                <img
                  src={form.image}
                  alt={form.altText || "Preview"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[5/1] min-h-[100px] bg-muted flex items-center justify-center text-[12px] text-muted-foreground">
                No image set
              </div>
            )}
          </div>
          <div className="flex flex-col border-t border-border pt-4 gap-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground uppercase tracking-widest font-bold">
                Impressions
              </span>
              <span>{ad.impressions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground uppercase tracking-widest font-bold">
                Clicks
              </span>
              <span>{ad.clicks.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAds() {
  const { ads, updateAd, getAdByPlacement } = useAds();
  const headerBanner = getAdByPlacement("header-banner");
  const homepageMid = ads.find((a) => a.placement === "homepage-mid");
  const articleInline = ads.find((a) => a.placement === "article-inline");
  const homepageLatestSidebar = getAdByPlacement("sidebar");
  const otherAds = ads.filter(
    (a) =>
      a.placement !== "header-banner" &&
      a.placement !== "homepage-mid" &&
      a.placement !== "article-inline" &&
      a.placement !== "sidebar",
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b border-border pb-6">
        <h1 className="font-serif text-[32px] font-bold text-foreground">
          Advertisements
        </h1>
        <p className="text-[14px] text-muted-foreground mt-2 max-w-[600px]">
          Manage sponsored placements across the site. Set status to{" "}
          <strong>Active</strong> and upload a banner for live ads. The header
          slot shows a placeholder when no active ad is set.
        </p>
      </header>

      {headerBanner && (
        <AdEditor
          ad={headerBanner}
          onSave={(changes) => updateAd(headerBanner.id, changes)}
          description="Controls the banner directly below the navigation on the homepage. While status is not Active, visitors see the dashed placeholder."
          recommendedSize="970 × 250 px"
          previewHref="/"
        />
      )}

      {homepageMid && (
        <AdEditor
          ad={homepageMid}
          onSave={(changes) => updateAd(homepageMid.id, changes)}
          description="Full-width banner on the homepage, directly under Legal Notices and Lifestyle."
          recommendedSize="1400 × 280 px (5:1)"
        />
      )}

      {articleInline && (
        <AdEditor
          ad={articleInline}
          onSave={(changes) => updateAd(articleInline.id, changes)}
          description="Sponsored unit embedded midway through every published article (after the first few paragraphs)."
          recommendedSize="860 × 484 px (16:9)"
        />
      )}

      {homepageLatestSidebar && (
        <AdEditor
          ad={homepageLatestSidebar}
          onSave={(changes) => updateAd(homepageLatestSidebar.id, changes)}
          description="Vertical ad in the right column beside the Latest News list on the homepage (sticky on large screens)."
          recommendedSize="400 × 800 px or larger (fills sidebar beside Latest News)"
          previewHref="/"
        />
      )}

      {otherAds.length > 0 && (
        <>
          <h2 className="font-serif text-[20px] font-bold border-b border-border pb-4">
            Other placements
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {otherAds.map((ad) => (
              <AdEditor
                key={ad.id}
                ad={ad}
                onSave={(changes) => updateAd(ad.id, changes)}
                description={`Placement: ${ad.placementLabel}. (Display on site coming soon.)`}
                recommendedSize="970 × 250 px"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
