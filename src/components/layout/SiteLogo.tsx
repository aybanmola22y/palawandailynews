import { cn } from "@/lib/utils";

/** Original asset in /public — served as-is (no recompression or upscaling). */
export const SITE_LOGO_SRC = "/pdn logo.webp";

/** Intrinsic pixels of pdn logo.webp (do not upscale in CSS beyond this). */
export const SITE_LOGO_INTRINSIC = {
  width: 300,
  height: 75,
} as const;

type SiteLogoProps = {
  className?: string;
  priority?: boolean;
};

/**
 * Renders the uploaded logo at full source fidelity.
 * Replace the file in /public with a higher-resolution export for sharper display on large screens.
 */
export function SiteLogo({ className, priority = false }: SiteLogoProps) {
  return (
    // Native img: avoids Next.js image optimizer so the original WebP is unchanged.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SITE_LOGO_SRC}
      alt="Palawan Daily News"
      width={SITE_LOGO_INTRINSIC.width}
      height={SITE_LOGO_INTRINSIC.height}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      className={cn(
        "h-10 w-auto max-w-[min(100%,280px)] object-contain object-left sm:h-11",
        className,
      )}
    />
  );
}
