import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminStatCard({
  label,
  value,
  hint,
  href,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  accent?: "default" | "primary" | "success" | "warning";
}) {
  const accentBorder = {
    default: "",
    primary: "border-l-[3px] border-l-[#C41E3A]",
    success: "border-l-[3px] border-l-[#008A45]",
    warning: "border-l-[3px] border-l-[#B45309]",
  }[accent ?? "default"];

  const inner = (
    <div
      className={cn(
        "bg-white dark:bg-[#1A1A18] border border-border p-5 flex flex-col min-h-[100px]",
        accentBorder,
        href && "hover:border-primary/40 transition-colors",
      )}
    >
      <div className="text-muted-foreground text-[11px] uppercase tracking-widest font-bold mb-2">
        {label}
      </div>
      <div className="font-serif text-[32px] font-bold text-foreground leading-none">
        {value}
      </div>
      {hint && (
        <p className="text-[12px] text-muted-foreground mt-2 leading-relaxed">{hint}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
