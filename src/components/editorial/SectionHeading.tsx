import Link from "next/link";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  href,
  linkLabel = "View all",
  className,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4 border-b border-border pb-4 mb-8",
        className,
      )}
    >
      <h2 className="font-serif text-2xl md:text-[28px] text-foreground tracking-tight">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-[11px] uppercase tracking-[0.12em] font-semibold text-muted-foreground hover:text-primary transition-colors"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}
