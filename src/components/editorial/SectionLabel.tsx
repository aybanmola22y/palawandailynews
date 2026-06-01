import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block text-[11px] uppercase tracking-[0.14em] font-semibold text-primary",
        className,
      )}
    >
      {children}
    </span>
  );
}
