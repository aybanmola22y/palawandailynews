"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    label: "Environment",
    href: "/latest?topic=Environment",
    topic: "Environment",
    blurb: "Land, sea, and conservation",
  },
  {
    label: "Business",
    href: "/latest?topic=Business",
    topic: "Business",
    blurb: "Trade, tourism, and markets",
  },
  {
    label: "Opinion",
    href: "/opinion",
    topic: null,
    blurb: "Columns and commentary",
  },
  {
    label: "Legal notices",
    href: "/legal",
    topic: null,
    blurb: "Public registry",
  },
  {
    label: "Lifestyle",
    href: "/lifestyle",
    topic: null,
    blurb: "Culture and living",
  },
] as const;

export function LatestSidebar() {
  const searchParams = useSearchParams();
  const activeTopic = searchParams.get("topic")?.trim() ?? "";

  return (
    <div className="flex flex-col gap-10 xl:sticky xl:top-24 xl:self-start">
      <section>
        <div className="mb-1 border-b border-border pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Browse
          </p>
          <h3 className="mt-1.5 font-serif text-2xl tracking-tight text-foreground">
            Sections
          </h3>
        </div>

        <nav aria-label="News sections">
          <ul>
            {SECTIONS.map((item, index) => {
              const isActive =
                item.topic != null &&
                activeTopic.toLowerCase() === item.topic.toLowerCase();
              const n = String(index + 1).padStart(2, "0");

              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group grid grid-cols-[2rem_1fr_auto] items-start gap-x-3 border-b border-border py-4 transition-colors duration-200",
                      isActive ? "border-primary/25" : "hover:border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "pt-0.5 font-mono text-[10px] tracking-wider transition-colors duration-200",
                        isActive
                          ? "font-semibold text-primary"
                          : "text-muted-foreground/70 group-hover:text-primary",
                      )}
                    >
                      {n}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block text-[15px] font-medium leading-snug transition-colors duration-200",
                          isActive
                            ? "text-primary"
                            : "text-foreground group-hover:text-primary",
                        )}
                      >
                        {item.label}
                      </span>
                      <span className="mt-1 block text-[12px] leading-snug text-muted-foreground">
                        {item.blurb}
                      </span>
                    </span>
                    <ArrowUpRight
                      className={cn(
                        "mt-1 h-3.5 w-3.5 shrink-0 transition-all duration-200",
                        isActive
                          ? "text-primary opacity-100"
                          : "text-muted-foreground/35 opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:text-primary",
                      )}
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </section>

      <section className="relative overflow-hidden rounded-sm border border-border bg-[#FAF9F7] dark:bg-secondary/40">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 90% 80% at 0% 0%, rgba(196,30,58,0.08), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="relative p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Opinion
          </p>
          <p className="mt-4 font-serif text-[19px] leading-snug tracking-tight text-foreground">
            Essays and commentary from Palawan&apos;s columnists.
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
            Analysis, argument, and local perspective — updated throughout the week.
          </p>
          <Link
            href="/opinion"
            className="mt-5 inline-flex items-center gap-2 border border-primary/20 bg-background px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition-all duration-200 hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Read opinion
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
