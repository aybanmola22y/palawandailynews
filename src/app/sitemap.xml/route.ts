import { getSiteUrl } from "@/lib/site-url";
import {
  articleSitemapPageCount,
  getCachedPublishedArticleCount,
  sitemapXmlResponse,
  xmlEscape,
} from "@/lib/articles/sitemap-data";

export const revalidate = 3600;

/**
 * Sitemap index — tiny/fast for Googlebot.
 * Chunks live at /sitemaps/0.xml (static) and /sitemaps/1.xml+ (articles).
 */
export async function GET() {
  const base = getSiteUrl();
  const total = await getCachedPublishedArticleCount();
  const articlePages = articleSitemapPageCount(total);

  const ids = [0, ...Array.from({ length: articlePages }, (_, i) => i + 1)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ids
  .map(
    (id) => `  <sitemap>
    <loc>${xmlEscape(`${base}/sitemaps/${id}.xml`)}</loc>
  </sitemap>`,
  )
  .join("\n")}
</sitemapindex>`;

  return sitemapXmlResponse(body);
}
