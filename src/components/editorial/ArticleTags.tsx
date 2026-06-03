import Link from "next/link";
import { cn } from "@/lib/utils";

export type ArticleTagsProps = {
  tags?: string[];
  className?: string;
  /** When true, tags are styled but not linked (e.g. admin preview). */
  static?: boolean;
  /** `footer` = below article body; `inline` = compact chips under an input. */
  variant?: "footer" | "inline";
};

function normalizeTags(tags?: string[]): string[] {
  return (tags ?? []).map((t) => t.trim()).filter(Boolean);
}

export function ArticleTags({
  tags,
  className,
  static: isStatic,
  variant = "footer",
}: ArticleTagsProps) {
  const visible = normalizeTags(tags);
  if (!visible.length) return null;

  const pillClass =
    "inline-block rounded-full border border-border bg-background px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground";
  const isInline = variant === "inline";

  return (
    <div
      className={cn(
        isInline ? "mt-2" : "mt-10 pt-8 border-t border-border",
        className,
      )}
    >
      {!isInline && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          Tags
        </p>
      )}
      <ul className={cn("flex flex-wrap", isInline ? "gap-1.5" : "gap-2")}>
        {visible.map((tag) => (
          <li key={tag}>
            {isStatic ? (
              <span className={pillClass}>{tag}</span>
            ) : (
              <Link
                href={`/search?q=${encodeURIComponent(tag)}`}
                className={cn(pillClass, "transition-colors hover:border-primary hover:text-primary")}
              >
                {tag}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
