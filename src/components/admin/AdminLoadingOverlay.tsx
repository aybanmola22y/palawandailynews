"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type AdminLoadingOverlayProps = {
  open: boolean;
  label: string;
  description?: string;
  className?: string;
};

/** Full-screen loading state for long admin actions (save, publish, delete). */
export function AdminLoadingOverlay({
  open,
  label,
  description,
  className,
}: AdminLoadingOverlayProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-100 flex items-center justify-center",
        "bg-black/45 backdrop-blur-[2px]",
        className,
      )}
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={label}
    >
      <div className="bg-white dark:bg-[#1A1A18] border border-border px-10 py-8 flex flex-col items-center gap-4 min-w-[300px] max-w-[90vw] shadow-xl">
        <Spinner className="size-9 text-[#C41E3A]" />
        <p className="text-[13px] font-bold uppercase tracking-[0.18em] text-foreground text-center">
          {label}
        </p>
        {description ? (
          <p className="text-[13px] text-muted-foreground text-center leading-relaxed max-w-[320px]">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
