"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  Building2,
  CalendarDays,
  Download,
  FileText,
  Landmark,
  Scale,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { legalNotices } from "@/data/legal";
import { cn } from "@/lib/utils";

const STATUS_TABS = ["All", "Active", "Closed"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

function parseNoticeDate(date: string) {
  const cleaned = date.replace(",", "");
  const [month, day, year] = cleaned.split(/\s+/);
  return {
    month: (month ?? "").slice(0, 3).toUpperCase(),
    day: day ?? "",
    year: year ?? "",
  };
}

function isActive(status: string) {
  return status.trim().toLowerCase() === "active";
}

const EASE = [0.22, 1, 0.36, 1] as const;

function useMotionVariants() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.08, delayChildren: 0.05 },
    },
  };
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: EASE },
    },
  };
  return { container, item, reduce };
}

function CalendarBlock({
  date,
  size = "default",
}: {
  date: string;
  size?: "default" | "large";
}) {
  const { month, day, year } = parseNoticeDate(date);
  const large = size === "large";
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center gap-0.5 border-r border-border bg-secondary/50",
        large ? "w-24 py-8" : "w-[76px] py-6",
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
        {month}
      </span>
      <span
        className={cn(
          "font-serif leading-none text-foreground",
          large ? "text-5xl" : "text-3xl",
        )}
      >
        {day}
      </span>
      <span className="text-[10px] text-muted-foreground">{year}</span>
    </div>
  );
}

function ActiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
      </span>
      Active
    </span>
  );
}

function ViewPdfButton({
  variant = "outline",
}: {
  variant?: "outline" | "solid";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-sm px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
        variant === "solid"
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "border border-border bg-card text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
      )}
    >
      <Download className="h-4 w-4" aria-hidden />
      View PDF
    </button>
  );
}

function LegalHero({
  total,
  activeCount,
  agencyCount,
}: {
  total: number;
  activeCount: number;
  agencyCount: number;
}) {
  const { container, item } = useMotionVariants();

  const stats = [
    { label: "Total notices", value: total, icon: FileText },
    { label: "Open for action", value: activeCount, icon: ShieldCheck },
    { label: "Government agencies", value: agencyCount, icon: Landmark },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border bg-secondary/60">
      <Scale
        className="pointer-events-none absolute -right-10 top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 text-primary/[0.05] lg:block"
        aria-hidden
      />

      <div className="editorial-container relative py-14 md:py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                Palawan Daily News · Public Registry
              </p>
            </div>
            <h1 className="mt-5 font-serif text-[2.75rem] leading-[0.98] tracking-tight text-foreground md:text-[3.75rem]">
              Legal &amp; Public
              <br />
              Notices
            </h1>
            <div className="mt-5 h-1 w-16 bg-primary" aria-hidden />
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-[17px] md:leading-[1.65]">
              Official announcements, biddings, regulatory notices, and public
              hearings for the Province of Palawan — verified and published in
              the public record.
            </p>
          </motion.div>

          <motion.dl
            className="grid w-full grid-cols-3 gap-3 lg:w-auto lg:min-w-[440px]"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {stats.map(({ label, value, icon: Icon }) => (
              <motion.div
                key={label}
                variants={item}
                className="relative overflow-hidden rounded-sm border border-border bg-card p-4 shadow-sm md:p-5"
              >
                <span className="absolute inset-x-0 top-0 h-0.5 bg-primary" aria-hidden />
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border bg-secondary/60">
                  <Icon className="h-4 w-4 text-primary" aria-hidden />
                </span>
                <dd className="mt-4 font-serif text-3xl tabular-nums text-foreground md:text-4xl">
                  {value.toLocaleString()}
                </dd>
                <dt className="mt-1 text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] text-muted-foreground">
                  {label}
                </dt>
              </motion.div>
            ))}
          </motion.dl>
        </div>
      </div>
    </section>
  );
}

function FeaturedNotice({ notice }: { notice: (typeof legalNotices)[number] }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: EASE }}
      className="group editorial-card relative flex flex-col overflow-hidden md:flex-row"
    >
      <span className="absolute inset-y-0 left-0 z-10 w-1 bg-primary" aria-hidden />

      <div className="hidden md:block">
        <CalendarBlock date={notice.date} size="large" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
              Latest notice
            </span>
            <ActiveBadge />
            <span className="font-mono text-[10px] tracking-tight text-muted-foreground">
              {notice.id}
            </span>
          </div>

          <h2 className="mt-4 font-serif text-2xl leading-[1.15] text-foreground transition-colors group-hover:text-primary md:text-[2rem]">
            {notice.title}
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {notice.agency}
            </span>
            <span className="inline-flex items-center gap-1.5 md:hidden">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {notice.date}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <ViewPdfButton variant="solid" />
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Official document · PDF
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export default function Legal() {
  const { container, item } = useMotionVariants();
  const [search, setSearch] = useState("");
  const [agency, setAgency] = useState("All");
  const [status, setStatus] = useState<StatusTab>("All");

  const agencies = useMemo(
    () => [...new Set(legalNotices.map((n) => n.agency))].sort(),
    [],
  );

  const statusCounts = useMemo(() => {
    return {
      All: legalNotices.length,
      Active: legalNotices.filter((n) => isActive(n.status)).length,
      Closed: legalNotices.filter((n) => !isActive(n.status)).length,
    } satisfies Record<StatusTab, number>;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return legalNotices.filter((notice) => {
      if (agency !== "All" && notice.agency !== agency) return false;
      if (status !== "All") {
        const wantsActive = status === "Active";
        if (isActive(notice.status) !== wantsActive) return false;
      }
      if (!q) return true;
      return (
        notice.title.toLowerCase().includes(q) ||
        notice.agency.toLowerCase().includes(q) ||
        notice.id.toLowerCase().includes(q)
      );
    });
  }, [search, agency, status]);

  const activeNotices = filtered.filter((n) => isActive(n.status));
  const closedNotices = filtered.filter((n) => !isActive(n.status));
  const [featured, ...restActive] = activeNotices;

  const hasFilters =
    Boolean(search.trim()) || agency !== "All" || status !== "All";

  function clearFilters() {
    setSearch("");
    setAgency("All");
    setStatus("All");
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <LegalHero
        total={legalNotices.length}
        activeCount={statusCounts.Active}
        agencyCount={agencies.length}
      />

      <div className="editorial-container">
        {/* Toolbar */}
        <div className="sticky top-[76px] z-20 -mx-4 border-b border-border bg-background/90 px-4 py-5 backdrop-blur supports-backdrop-filter:bg-background/70 sm:mx-0 sm:px-0 md:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  aria-pressed={status === option}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-sm border px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors",
                    status === option
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  {option}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums leading-none",
                      status === option
                        ? "bg-primary-foreground/20"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {statusCounts[option]}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notices, agency, reference…"
                  aria-label="Search notices"
                  className="w-full border border-border bg-card py-2.5 pl-9 pr-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary sm:w-[260px]"
                />
              </div>
              <select
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                aria-label="Filter by agency"
                className="w-full max-w-full border border-border bg-card px-3 py-2.5 text-[13px] text-foreground outline-none transition-colors focus:border-primary sm:w-[200px]"
              >
                <option value="All">All agencies</option>
                {agencies.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-primary"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-28 text-center">
            <FileText
              className="mx-auto h-8 w-8 text-muted-foreground/50"
              aria-hidden
            />
            <p className="mt-4 font-serif text-xl text-foreground">
              No notices found
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different agency, status, or search term.
            </p>
          </div>
        ) : (
          <div className="py-10 md:py-14">
            {/* Active notices */}
            {activeNotices.length > 0 ? (
              <section className="mb-16">
                <div className="mb-6 flex items-center gap-3">
                  <span className="h-px w-7 bg-primary" aria-hidden />
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                    Open for public action
                  </p>
                </div>

                {featured ? <FeaturedNotice notice={featured} /> : null}

                {restActive.length > 0 ? (
                  <motion.div
                    className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-60px" }}
                  >
                    {restActive.map((notice) => (
                      <motion.article
                        key={notice.id}
                        variants={item}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="group editorial-card flex overflow-hidden"
                      >
                        <CalendarBlock date={notice.date} />
                        <div className="flex min-w-0 flex-1 flex-col p-5 md:p-6">
                          <div className="flex flex-wrap items-center gap-2">
                            <ActiveBadge />
                            <span className="font-mono text-[10px] tracking-tight text-muted-foreground">
                              {notice.id}
                            </span>
                          </div>
                          <h3 className="mt-3.5 font-serif text-lg leading-snug text-foreground transition-colors group-hover:text-primary md:text-xl">
                            {notice.title}
                          </h3>
                          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            <span className="truncate">{notice.agency}</span>
                          </p>
                          <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4">
                            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" aria-hidden />
                              Official PDF
                            </span>
                            <ViewPdfButton />
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </motion.div>
                ) : null}
              </section>
            ) : null}

            {/* Archived record */}
            {closedNotices.length > 0 ? (
              <section>
                <div className="mb-6 flex items-center gap-3">
                  <span className="h-px w-7 bg-border" aria-hidden />
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                    Archived record
                  </p>
                </div>
                <motion.div
                  className="editorial-card overflow-hidden"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, ease: EASE }}
                >
                  <ul className="flex flex-col divide-y divide-border">
                    {closedNotices.map((notice) => (
                      <li key={notice.id}>
                        <article className="group flex flex-col gap-4 p-5 transition-colors hover:bg-secondary/30 md:flex-row md:items-center md:justify-between md:gap-8 md:p-6">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                Closed
                              </span>
                              <span className="font-mono text-[10px] tracking-tight text-muted-foreground">
                                {notice.id}
                              </span>
                            </div>
                            <h3 className="mt-2.5 font-serif text-base leading-snug text-foreground transition-colors group-hover:text-primary md:text-lg">
                              {notice.title}
                            </h3>
                            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" aria-hidden />
                                {notice.agency}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                                {notice.date}
                              </span>
                            </div>
                          </div>
                          <ViewPdfButton />
                        </article>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
