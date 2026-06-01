import { cn } from "@/lib/utils";

export function DividerLabel({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-4 my-12 md:my-16", className)}
      role="separator"
    >
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] uppercase tracking-[0.22em] font-semibold text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
