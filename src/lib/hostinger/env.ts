export type HostingerFtpConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  /** Folder inside FTP `public_html` (e.g. `pdn_new_website_uploads`). */
  uploadsDir: string;
  /** Optional URL prefix (empty = site root, e.g. `/pdn_new_website_uploads/...`). */
  publicWebPrefix: string;
  publicBaseUrl: string;
};

function env(key: string): string {
  return process.env[key]?.trim() ?? "";
}

/** Server-only FTP settings from `.env`. */
export function getHostingerFtpConfig(): HostingerFtpConfig | null {
  const host = env("FTP_HOST");
  const user = env("FTP_USER");
  const password = env("FTP_PASSWORD");
  const publicBaseUrl = env("FTP_PUBLIC_BASE_URL");

  if (!host || !user || !password || !publicBaseUrl) return null;

  const portRaw = env("FTP_PORT");
  const port = portRaw ? Number.parseInt(portRaw, 10) : 21;

  return {
    host,
    port: Number.isFinite(port) ? port : 21,
    user,
    password,
    secure: env("FTP_SECURE").toLowerCase() === "true",
    uploadsDir: env("FTP_UPLOADS_DIR") || "pdn_new_website_uploads",
    publicWebPrefix: env("FTP_PUBLIC_WEB_PREFIX"),
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
  };
}

export function isHostingerFtpConfigured(): boolean {
  return getHostingerFtpConfig() !== null;
}
