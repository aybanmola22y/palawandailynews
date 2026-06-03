import { Client } from "basic-ftp";
import { Readable } from "node:stream";
import { getHostingerFtpConfig, type HostingerFtpConfig } from "@/lib/hostinger/env";

export type ImageUploadFolder = "articles" | "ads" | "inline";

const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function sanitizeFilename(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 80) || "image";
}

function extensionForMime(mime: string, originalName: string): string {
  const fromName = originalName.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

function joinRemotePath(...parts: string[]): string {
  return parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

function publicUrl(config: HostingerFtpConfig, webPath: string): string {
  const path = webPath.replace(/^\/+/, "");
  return `${config.publicBaseUrl}/${path}`;
}

/** Public URL path: https://palawandailynews.com/pdn_new_website_uploads/... */
function webUploadDir(config: HostingerFtpConfig): string {
  return joinRemotePath(config.publicWebPrefix, config.uploadsDir);
}

function isWordPressRoot(list: { name: string }[]): boolean {
  return list.some((x) => x.name === "wp-login.php" || x.name === "index.php");
}

/**
 * Hostinger hPanel “public_html” = FTP site root (/).
 * Upload folder: /pdn_new_website_uploads (sibling to wp-content, not inside a nested public_html/).
 */
async function cdToUploadsFolder(
  client: Client,
  uploadsDir: string,
): Promise<void> {
  let pwd = (await client.pwd()).replace(/\\/g, "/");

  // FTP sometimes opens in a mistaken /public_html subfolder — site root is one level up.
  if (pwd === "/public_html") {
    const here = await client.list();
    if (!isWordPressRoot(here)) {
      await client.cd("..");
      pwd = (await client.pwd()).replace(/\\/g, "/");
    }
  }

  if (pwd.endsWith(`/${uploadsDir}`)) {
    return;
  }

  try {
    await client.cd(uploadsDir);
    return;
  } catch {
    /* create at site root */
  }

  if (pwd !== "/") {
    await client.cd("/");
  }

  await ensureNestedDirs(client, uploadsDir);
}

/** Create each folder segment; end inside the target directory. */
async function ensureNestedDirs(client: Client, dirPath: string): Promise<void> {
  const parts = dirPath.split("/").filter(Boolean);
  for (const part of parts) {
    try {
      await client.cd(part);
      continue;
    } catch {
      /* not found yet */
    }
    try {
      await client.send(`MKD ${part}`);
    } catch {
      /* may already exist */
    }
    await client.cd(part);
  }
}

export async function uploadImageToHostingerFtp(
  buffer: Buffer,
  options: {
    mimeType: string;
    originalName: string;
    folder: ImageUploadFolder;
  },
): Promise<{ url: string; remotePath: string }> {
  const config = getHostingerFtpConfig();
  if (!config) {
    throw new Error("Hostinger FTP is not configured in .env.");
  }

  const mime = options.mimeType.toLowerCase();
  if (!ALLOWED_TYPES.has(mime)) {
    throw new Error("Only JPEG, PNG, WebP, and GIF images are allowed.");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("Image must be 8 MB or smaller.");
  }

  const ext = extensionForMime(mime, options.originalName);
  const filename = `${Date.now()}-${sanitizeFilename(options.originalName)}.${ext}`;
  const webPath = joinRemotePath(webUploadDir(config), filename);

  const client = new Client(30_000);
  try {
    await client.access({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      secure: config.secure,
    });

    const startDir = await client.pwd();
    try {
      await cdToUploadsFolder(client, config.uploadsDir);
      await client.uploadFrom(Readable.from(buffer), filename);
    } finally {
      await client.cd(startDir).catch(() => undefined);
    }
  } finally {
    client.close();
  }

  return {
    url: publicUrl(config, webPath),
    remotePath: webPath,
  };
}
