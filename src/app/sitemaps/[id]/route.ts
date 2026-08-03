import { getSiteUrl } from "@/lib/site-url";
import {
  ARTICLES_PER_SITEMAP,
  MAX_ARTICLE_SITEMAPS,
  getCachedArticleSitemapPage,
  sitemapXmlResponse,
  xmlEscape,
} from "@/lib/articles/sitemap-data";

export const revalidate = 3600;

type RouteParams = { params: Promise<{ id: string }> };

function staticUrlset(base: string): string {
  const now = new Date().toISOString();
  const pages: { path: string; changefreq: string; priority: string }[] = [
    { path: "/", changefreq: "hourly", priority: "1.0" },
    { path: "/latest", changefreq: "hourly", priority: "0.9" },
    { path: "/opinion", changefreq: "daily", priority: "0.8" },
    { path: "/lifestyle", changefreq: "daily", priority: "0.7" },
    { path: "/legal", changefreq: "weekly", priority: "0.6" },
    { path: "/advertise", changefreq: "monthly", priority: "0.5" },
    { path: "/about", changefreq: "monthly", priority: "0.5" },
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${xmlEscape(`${base}${p.path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;
}

function articleUrlset(
  base: string,
  rows: { id: string; date: string | null; updated_at: string | null }[],
): string {
  const urls = rows.map((row) => {
    const updated = row.updated_at ? new Date(row.updated_at) : null;
    const dated = row.date ? new Date(row.date) : null;
    const lastModified =
      updated && !Number.isNaN(updated.getTime())
        ? updated.toISOString()
        : dated && !Number.isNaN(dated.getTime())
          ? dated.toISOString()
          : new Date().toISOString();

    return `  <url>
    <loc>${xmlEscape(`${base}/article/${encodeURIComponent(row.id)}`)}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

/**
 * Chunked sitemap files:
 * - /sitemaps/0.xml → static pages
 * - /sitemaps/1.xml+ → published articles (1000 each)
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const raw = (await params).id.replace(/\.xml$/i, "");
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id < 0 || id > MAX_ARTICLE_SITEMAPS) {
    return new Response("Not found", { status: 404 });
  }

  const base = getSiteUrl();

  if (id === 0) {
    return sitemapXmlResponse(staticUrlset(base));
  }

  const page = id - 1;
  if (page * ARTICLES_PER_SITEMAP >= MAX_ARTICLE_SITEMAPS * ARTICLES_PER_SITEMAP) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await getCachedArticleSitemapPage(page);
  if (!rows.length) {
    return new Response("Not found", { status: 404 });
  }

  return sitemapXmlResponse(articleUrlset(base, rows));
}
