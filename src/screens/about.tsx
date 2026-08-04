"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Target,
  HeartHandshake,
  Users,
  Quote,
  CheckCircle2,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { authorProfilePath } from "@/lib/author-profile";
import { cn } from "@/lib/utils";

const OWNERSHIP_AND_FUNDING = [
  "Palawan Daily News is a quad media publishing company owned and published by Alpha Eight Publishing, a registered company in the Philippines through its Department of Trade Industry and the Bureau of Internal Revenue.",
  "The publication is self-funded and has been in operations since June 8, 2018 with no political affiliations. Palawan Daily News founders are Architect Kent N. Janaban, the publisher, Engineer Harthwell C. Capistrano, the editor in chief and Clarina Herrera Gududah, a well experienced broadcast journalist.",
  "Majority of the income of the company comes from advertisements and self-funding among its co-founders.",
  "Palawan Daily News started to publish online, digital newspaper and eventually ventured on printing weekly regional newspaper. Now, it is so far, the first, and the only quad media company in MIMAROPA, Philippines, with online radio and TV broadcast.",
  "It focuses on lifestyle, business and current events, including investigative journalism, while its online radio programs include news and commentary, lifestyle and original indie music.",
  "Palawan Daily News is founded with the passion to provide the community with trusted, fair and balanced reporting.",
] as const;

const STATS = [
  { value: "2024", label: "Founded" },
  { value: "40K+", label: "Readers / month" },
  { value: "1,200+", label: "Stories published" },
  { value: "12", label: "In the newsroom" },
] as const;

const TEAM = [
  {
    name: "Harthwell Capistrano",
    role: "Editor-in-Chief",
    bio: "Leads the newsroom’s editorial direction and standards.",
    accent: "from-[#E8D8D2] via-[#F4EEEA] to-[#EDE6E0]",
  },
  {
    name: "Hanna Camella Talabucon",
    role: "Associate Editor",
    bio: "Edits and reports on public-interest stories across Palawan and MIMAROPA.",
    accent: "from-[#D7E0E8] via-[#EEF2F5] to-[#E4E9EE]",
  },
  {
    name: "Gerardo Reyes Jr.",
    role: "Staff Reporter",
    bio: "Covers governance, community issues, and breaking updates.",
    accent: "from-[#D9E4D8] via-[#EEF3EC] to-[#E3EBE2]",
  },
  {
    name: "Lance Factor",
    role: "Head of Digital",
    bio: "Product, distribution, and newsroom systems for digital publishing.",
    accent: "from-[#E4D8E4] via-[#F3EDF3] to-[#EBE4EB]",
  },
] as const;

function teamInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !/^(jr\.?|sr\.?|ii|iii|iv)$/i.test(part));
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const VALUES = [
  "We work with integrity, respect and teamwork, valuing our people, performing with high level of excellence and quality with great accuracy and impartiality.",
] as const;

const STANDARDS = [
  "Verification before publication",
  "Clear sourcing and attribution",
  "Corrections when we get it wrong",
  "Separation of editorial and advertising",
  "Respect for privacy, safety, and vulnerable communities",
] as const;

const VISION =
  "To be recognized as the leading and most trusted publishing company in the region, reaching out to people locally and globally." as const;

const CONTACT = {
  headOffice:
    "3/F, Unit 305 Trigold Business Park, National Highway, San Pedro, Puerto Princesa City 5300 Philippines",
  email: "info@palawandailynews.com",
  tel: "+63 (48) 717 0288",
  mobile: "+63 917 829 1370",
} as const;

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="editorial-container py-8 md:py-10">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Palawan Daily News · MIMAROPA
          </p>
          <h1 className="mt-3 font-serif text-4xl md:text-5xl leading-[1.05]">
            About
          </h1>
          <p className="mt-4 text-[15px] md:text-base leading-relaxed text-muted-foreground">
            Palawan Daily News is a regional Quad Media Network based in Puerto Princesa
            City, which provide products and services ranging from publishing, marketing
            and promotions.
          </p>
        </motion.header>

        <section className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="editorial-card p-4">
              <div className="font-serif text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* Mission, vision & values */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-12 items-start gap-6 lg:gap-8">
          <div className="lg:col-span-7 space-y-6">
            <div className="editorial-card p-6 md:p-8">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-[0.18em] font-semibold">
                Mission, vision & values
              </div>

              <div className="mt-5 space-y-8">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Mission
                  </div>
                  <h2 className="mt-3 font-serif text-2xl leading-snug">
                    Independent journalism for the public interest.
                  </h2>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    To deliver fresh, inspiring, and engaging content in various platforms to
                    the world that is seeking for truth and balanced information through
                    dynamic, talented and innovative people
                  </p>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    Vision
                  </div>
                  <h3 className="mt-3 font-serif text-xl leading-snug">
                    Journalism people can rely on.
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                    {VISION}
                  </p>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-[0.18em] font-semibold">
                    <HeartHandshake className="h-4 w-4" />
                    Values
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    {VALUES[0]}
                  </p>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-border rounded-sm p-4">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        Focus
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Verified reporting, explainers, and on‑the‑ground updates.
                      </p>
                    </div>
                    <div className="border border-border rounded-sm p-4">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        Base
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Puerto Princesa City, Palawan
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <div className="flex items-start gap-3 text-muted-foreground">
                  <Quote className="h-4 w-4 mt-0.5" />
                  <p className="text-sm leading-relaxed">
                    We aim to be useful: clear facts, fair context, and stories that help
                    readers understand what matters—and why.
                  </p>
                </div>
              </div>
            </div>

            <div className="editorial-card p-6 md:p-8">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-[0.18em] font-semibold">
                <Mail className="h-4 w-4" />
                Contact
              </div>

              <div className="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Head office
                  </div>
                  <p className="mt-2">{CONTACT.headOffice}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-border rounded-sm p-4">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <p className="mt-2">{CONTACT.email}</p>
                  </div>
                  <div className="border border-border rounded-sm p-4">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      Phone
                    </div>
                    <p className="mt-2">Tel: {CONTACT.tel}</p>
                    <p className="mt-1">Mobile: {CONTACT.mobile}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="editorial-card p-6 md:p-8">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-[0.18em] font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Editorial standards
              </div>

              <ul className="mt-5 space-y-3 text-[15px] text-muted-foreground leading-relaxed">
                {STANDARDS.map((s) => (
                  <li key={s} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{s}.</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="editorial-card p-6 md:p-8">
              <div className="text-muted-foreground text-[11px] uppercase tracking-[0.18em] font-semibold">
                Ownership and funding information
              </div>
              <div className="mt-4 space-y-6 text-sm text-muted-foreground leading-7">
                {OWNERSHIP_AND_FUNDING.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              <Users className="h-3.5 w-3.5" />
              Who we are
            </span>
            <h2 className="mt-5 font-serif text-3xl md:text-4xl leading-[1.1] tracking-tight text-foreground">
              A small team, focused on reporting.
            </h2>
            <p className="mt-4 text-[15px] md:text-base leading-relaxed text-muted-foreground">
              We’re a compact newsroom—built for speed when it matters, and depth when
              it counts.
            </p>
          </div>

          <div className="mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
            {TEAM.map((m, index) => {
              const profileHref = `${authorProfilePath(m.name)}?name=${encodeURIComponent(m.name)}`;

              return (
                <article
                  key={m.name}
                  className="group flex flex-col rounded-[28px] border border-border bg-card p-3 text-foreground shadow-[0_12px_40px_-28px_rgba(30,24,18,0.35)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <Link
                    href={profileHref}
                    prefetch={false}
                    className="relative block aspect-[4/5] overflow-hidden rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`${m.name} portrait`}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-br",
                        m.accent,
                      )}
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 opacity-50"
                      style={{
                        backgroundImage:
                          "radial-gradient(ellipse 70% 55% at 50% 20%, rgba(255,255,255,0.55), transparent 60%)",
                      }}
                      aria-hidden
                    />
                    <span className="absolute left-4 top-4 font-mono text-[11px] font-semibold tracking-wider text-foreground/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-serif text-5xl tracking-wide text-foreground/80 md:text-6xl">
                        {teamInitials(m.name)}
                      </span>
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={profileHref}
                        prefetch={false}
                        className="truncate text-center font-semibold text-[17px] leading-tight tracking-tight text-foreground transition-colors hover:text-primary"
                      >
                        {m.name}
                      </Link>
                      <span
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500"
                        aria-label="Verified staff"
                      >
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      </span>
                    </div>
                    <p className="mt-1.5 text-center text-[13px] leading-snug text-muted-foreground">
                      {m.role}
                    </p>
                    <p className="mt-3 line-clamp-3 text-center text-[13px] leading-relaxed text-muted-foreground">
                      {m.bio}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Newsroom
                      </span>
                      <Link
                        href={profileHref}
                        prefetch={false}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary px-3.5 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        Profile
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

