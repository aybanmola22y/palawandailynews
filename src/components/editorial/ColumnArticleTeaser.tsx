import Link from "next/link";
import { cn } from "@/lib/utils";

export function ColumnArticleTeaser({
  href,
  title,
  date,
  className,
}: {
  href: string;
  title: string;
  date: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col h-full min-h-[7.25rem] p-4 rounded-sm",
        "border border-border bg-secondary/40",
        "hover:border-primary/35 hover:bg-secondary/70 transition-colors group",
        className,
      )}
    >
      <h4 className="font-serif text-base md:text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3 flex-1">
        {title}
      </h4>
      <time className="text-[10px] uppercase tracking-wider text-muted-foreground mt-4 pt-3 border-t border-border">
        {date}
      </time>
    </Link>
  );
}
