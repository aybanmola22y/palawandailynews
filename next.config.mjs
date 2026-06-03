import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const mediaHost = process.env.NEXT_PUBLIC_MEDIA_BASE_URL
  ? new URL(process.env.NEXT_PUBLIC_MEDIA_BASE_URL).hostname
  : "palawandailynews.com";

function buildCsp() {
  const turnstile = "https://challenges.cloudflare.com";
  const base =
    "frame-ancestors 'none'; base-uri 'self'; form-action 'self'";
  const supabaseOrigins = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl);
      supabaseOrigins.push(parsed.origin, `wss://${parsed.host}`);
    } catch {
      /* ignore */
    }
  }
  supabaseOrigins.push("https://*.supabase.co");
  const connect = `'self' ${supabaseOrigins.join(" ")} ${turnstile}`;
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    return `${base}; script-src 'self' 'unsafe-eval' 'unsafe-inline' ${turnstile}; frame-src 'self' ${turnstile}; connect-src ${connect} ws: wss:`;
  }
  return `${base}; script-src 'self' 'unsafe-inline' ${turnstile}; frame-src 'self' ${turnstile}; connect-src ${connect}`;
}

const csp = buildCsp();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: csp,
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig = {
  outputFileTracingRoot: projectRoot,
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
        source: "/:path*",
        headers: securityHeaders,
      },
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
