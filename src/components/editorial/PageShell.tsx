import { cn } from "@/lib/utils";

const layoutGridClass = {
  /** List pages: main column grows to use available width. */
  default:
    "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_340px] gap-10 xl:gap-12 2xl:gap-16",
  /** Opinion / lifestyle sidebars with thumbnail + title lists (matches article sidebar width). */
  wideSidebar:
    "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(460px,560px)] gap-10 xl:gap-12 2xl:gap-16",
  /** Opinion: wider rail so columnist cards are not squeezed. */
  opinion:
    "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(520px,42%)] 2xl:grid-cols-[minmax(0,1fr)_minmax(580px,44%)] gap-8 xl:gap-10 2xl:gap-12",
  /** Article detail: cap main column so the sidebar sits beside the story. */
  article:
    "grid w-full max-w-[min(100%,calc(56rem+440px+2.5rem))] 2xl:max-w-[min(100%,calc(56rem+480px+3rem))] grid-cols-1 xl:grid-cols-[minmax(0,56rem)_440px] 2xl:grid-cols-[minmax(0,56rem)_480px] gap-8 xl:gap-10 2xl:gap-12",
} as const;

export function PageShell({
  children,
  sidebar,
  className,
  layout = "default",
}: {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
  layout?: keyof typeof layoutGridClass;
}) {
  if (!sidebar) {
    return (
      <div className={cn("site-gutter w-full", className)}>{children}</div>
    );
  }

  return (
    <div className={cn("site-gutter w-full", className)}>
      <div className={cn(layoutGridClass[layout])}>
        <div className="min-w-0">{children}</div>
        <aside
          className={cn(
            "min-w-0 space-y-8",
            (layout === "default" ||
              layout === "wideSidebar" ||
              layout === "opinion") &&
              "xl:border-l xl:border-border xl:pl-10 2xl:pl-12",
            layout === "article" &&
              "xl:border-l xl:border-border xl:pl-8 2xl:pl-10",
          )}
        >
          {sidebar}
        </aside>
      </div>
    </div>
  );
}
