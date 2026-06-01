import { cn } from "@/lib/utils";

const titleClass = {
  default:
    "text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-4 pb-2 border-b border-border",
  prominent:
    "font-serif text-xl font-bold uppercase tracking-[0.08em] text-foreground mb-4 pb-3 border-b border-border",
} as const;

export function SidebarPanel({
  title,
  children,
  className,
  variant = "default",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  variant?: keyof typeof titleClass;
}) {
  return (
    <section className={cn("", className)}>
      <h3 className={titleClass[variant]}>{title}</h3>
      {children}
    </section>
  );
}
