import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { excerptToPlainText } from "@/lib/html-editor-content";
import { resolveImageUrl } from "@/lib/articles/map-article-row";
import { getSiteUrl } from "@/lib/site-url";
import { getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  articleIdLookupCandidates,
  isValidArticleId,
} from "@/lib/security/safe-url";

const SITE_NAME = "Palawan Daily News";
const OG_SELECT = "id, title, excerpt, image_url, author, category, status";

type OgArticleRow = {
  id: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  author: string | null;
  category: string | null;
  status: string | null;
};

function getAnonServerClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function plainDescription(excerpt: string | null | undefined, fallback: string) {
  const text = excerptToPlainText(excerpt ?? "").replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  if (text.length <= 200) return text;
  return `${text.slice(0, 197).trim()}…`;
}

function absoluteOgImage(image: string | null | undefined): string | undefined {
  const resolved = image ? resolveImageUrl(image) : "";
  if (!resolved) return undefined;
  if (/\.svg(\?|$)/i.test(resolved)) return undefined;
  if (/^(blob:|data:)/i.test(resolved)) return undefined;
  if (/^https?:\/\//i.test(resolved)) return resolved;
  return undefined;
}

export async function fetchArticleForMetadata(
  rawId: string,
): Promise<OgArticleRow | null> {
  if (!isSupabaseConfigured()) return null;

  const candidates = articleIdLookupCandidates(rawId);
  if (!candidates.length || !candidates.some(isValidArticleId)) return null;

  const client = getSupabaseServiceClient() ?? getAnonServerClient();
  if (!client) return null;

  const { data, error } = await client
    .from("articles")
    .select(OG_SELECT)
    .in("id", candidates)
    .eq("status", "Published")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as OgArticleRow;
}

export async function buildArticleMetadata(rawId: string): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const article = await fetchArticleForMetadata(rawId);
  const fallbackImage = `${siteUrl}/opengraph.jpg`;

  if (!article) {
    return {
      title: "Article",
      description: "Read this story on Palawan Daily News.",
      openGraph: {
        type: "article",
        siteName: SITE_NAME,
        images: [{ url: fallbackImage }],
      },
      twitter: {
        card: "summary_large_image",
        images: [fallbackImage],
      },
    };
  }

  const url = `${siteUrl}/article/${encodeURIComponent(article.id)}`;
  const description = plainDescription(
    article.excerpt,
    `Read “${article.title}” on Palawan Daily News.`,
  );
  const image = absoluteOgImage(article.image_url) ?? fallbackImage;

  return {
    title: article.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      locale: "en_PH",
      url,
      siteName: SITE_NAME,
      title: article.title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [image],
    },
  };
}
