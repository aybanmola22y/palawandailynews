/** @type {import('next').NextConfig} */
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  ? new URL(process.env.NEXT_PUBLIC_MEDIA_BASE_URL).hostname
  : "palawandailynews.com";

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: mediaHost, pathname: "/**" },
      { protocol: "https", hostname: "palawandailynews.com", pathname: "/**" },
      { protocol: "https", hostname: "www.palawandailynews.com", pathname: "/**" },
    ],
  },
  basePath: process.env.BASE_PATH
    ? process.env.BASE_PATH.replace(/\/$/, "")
    : undefined,
  experimental: {
    staleTimes: {
      dynamic: 300,
      static: 600,
    },
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*\\.(svg|png|jpg|jpeg|webp|ico|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
