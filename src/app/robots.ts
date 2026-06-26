import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://palawandailynews.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/search",
        "/*?*",
      ],
    },
    sitemap: `${siteUrl.replace(/\/+$/, "")}/sitemap.xml`,
  };
}
