import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSiteUrl } from "@/lib/site-url";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

/** Lean rows only — id + dates. Keeps free-tier egress small. */
const SITEMAP_SELECT = "id, date, updated_at";
/** Google allows 50k URLs per file; stay well under and paginate in DB. */
const MAX_URLS = 40_000;
const PAGE_SIZE = 1_000;

export const revalidate = 3600;

function getAnonServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function staticEntries(base: string): MetadataRoute.Sitemap {
  const now = new Date();
  const paths: {
    path: string;
    changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
    priority: number;
  }[] = [
    { path: "/", changeFrequency: "hourly", priority: 1 },
    { path: "/latest", changeFrequency: "hourly", priority: 0.9 },
    { path: "/opinion", changeFrequency: "daily", priority: 0.8 },
    { path: "/lifestyle", changeFrequency: "daily", priority: 0.7 },
    { path: "/legal", changeFrequency: "weekly", priority: 0.6 },
    { path: "/advertise", changeFrequency: "monthly", priority: 0.5 },
    { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  ];

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}

async function fetchPublishedArticleEntries(
  base: string,
): Promise<MetadataRoute.Sitemap> {
  if (!isSupabaseConfigured()) return [];

  const client = getAnonServerClient();
  if (!client) return [];

  const entries: MetadataRoute.Sitemap = [];
  const maxPages = Math.ceil(MAX_URLS / PAGE_SIZE);

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await client
      .from("articles")
      .select(SITEMAP_SELECT)
      .eq("status", "Published")
      .order("date", { ascending: false })
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) break;
    if (!data?.length) break;

    for (const row of data) {
      const updated = row.updated_at ? new Date(row.updated_at) : null;
      const dated = row.date ? new Date(row.date) : null;
      const lastModified =
        updated && !Number.isNaN(updated.getTime())
          ? updated
          : dated && !Number.isNaN(dated.getTime())
            ? dated
            : new Date();

      entries.push({
        url: `${base}/article/${encodeURIComponent(row.id)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    if (data.length < PAGE_SIZE) break;
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const [staticPages, articles] = await Promise.all([
    Promise.resolve(staticEntries(base)),
    fetchPublishedArticleEntries(base),
  ]);
  return [...staticPages, ...articles];
}
