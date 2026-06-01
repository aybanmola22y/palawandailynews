import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <header
      className={cn("mb-8 md:mb-10 pb-6 border-b border-border", className)}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary mb-2">
        Palawan Daily News
      </p>
      <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight mb-3">
        {title}
      </h1>
      {description && (
        <p className="text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
