"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Clock,
  LayoutGrid,
  Mail,
  MapPin,
  Megaphone,
  Phone,
  Users,
} from "lucide-react";

const STATS = [
  { value: "1.2M+", label: "Monthly readers", icon: Users },
  { value: "68%", label: "Business leaders", icon: BarChart3 },
  { value: "4.5m", label: "Avg. session time", icon: Clock },
] as const;

const PLACEMENTS = [
  {
    name: "Header Banner (homepage)",
    dimensions: "970×250",
    aspect: "aspect-[21/9]",
    description:
      "The banner directly below the navigation on the homepage. Ideal for time-sensitive campaigns and broad reach.",
  },
  {
    name: "Homepage Banner (mid-page)",
    dimensions: "1400×280",
    aspect: "aspect-[5/1]",
    description:
      "Full-width banner on the homepage, placed mid-page within the editorial flow for high visibility without disrupting reading.",
  },
  {
    name: "In-Article Sponsored (inline)",
    dimensions: "860×484",
    aspect: "aspect-video",
    description:
      "A sponsored unit embedded mid-article, designed to match our editorial rhythm while delivering strong engagement.",
  },
] as const;

const AUDIENCE_HIGHLIGHTS = [
  "Reach decision-makers, business leaders, and affluent consumers across Palawan and MIMAROPA.",
  "Quad media network spanning web, print, radio, and TV for integrated campaigns.",
  "Editorial environment built on trust, accuracy, and public-interest journalism.",
  "Flexible placements for brand awareness, product launches, and sustained visibility.",
] as const;

const CONTACT = {
  headOffice:
    "3/F Daniel Alley Bldg. II, National Highway, San Pedro, Puerto Princesa City 5300 Philippines",
  email: "info@palawandailynews.com",
  tel: "+63 (48) 717 0288",
  mobile: "+63 917 829 1370",
} as const;

export default function Advertise() {
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
            Advertise
          </h1>
          <p className="mt-4 text-[15px] md:text-base leading-relaxed text-muted-foreground">
            Connect your brand with Palawan&apos;s most influential decision-makers,
            business leaders, and affluent consumers through premium placements across
            our quad media network.
          </p>
        </motion.header>

        <section className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="editorial-card p-4 md:p-5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                <s.icon className="h-4 w-4" />
                {s.label}
              </div>
              <div className="mt-3 font-serif text-3xl md:text-4xl font-bold">
                {s.value}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 grid grid-cols-1 lg:grid-cols-12 items-start gap-6 lg:gap-8">
          <div className="lg:col-span-7 editorial-card p-6 md:p-8">
            <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-[0.18em] font-semibold">
              <LayoutGrid className="h-4 w-4" />
              Premium ad placements
            </div>

            <div className="mt-6 space-y-6">
              {PLACEMENTS.map((placement, index) => (
                <div
                  key={placement.name}
                  className={
                    index > 0 ? "border-t border-border pt-6" : undefined
                  }
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div
                      className={`w-full sm:w-[200px] ${placement.aspect} bg-secondary border border-border flex items-center justify-center shrink-0 rounded-sm`}
                    >
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {placement.dimensions}
                      </span>
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <h3 className="font-serif text-xl leading-snug">
                        {placement.name}
                      </h3>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {placement.description}
                      </p>
                      <button
                        type="button"
                        className="mt-4 inline-flex items-center gap-1.5 text-primary text-[11px] font-semibold uppercase tracking-[0.18em] hover:underline"
                      >
                        View specs
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="editorial-card p-6 md:p-8">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-[0.18em] font-semibold">
                <Megaphone className="h-4 w-4" />
                Why partner with us
              </div>

              <ul className="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
                {AUDIENCE_HIGHLIGHTS.map((item) => (
                  <li key={item} className="border border-border rounded-sm p-4">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="editorial-card p-6 md:p-8">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-[0.18em] font-semibold">
                <Mail className="h-4 w-4" />
                Contact sales
              </div>

              <div className="mt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    Head office
                  </div>
                  <p className="mt-2">{CONTACT.headOffice}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
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
        </section>
      </div>
    </div>
  );
}
