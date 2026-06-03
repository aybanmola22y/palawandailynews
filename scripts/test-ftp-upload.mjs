/**
 * Quick FTP path check. Run: node --env-file=.env scripts/test-ftp-upload.mjs
 */
import { Client } from "basic-ftp";

const host = process.env.FTP_HOST?.trim();
const user = process.env.FTP_USER?.trim();
const password = process.env.FTP_PASSWORD?.trim();
const port = Number.parseInt(process.env.FTP_PORT || "21", 10);
const secure = (process.env.FTP_SECURE || "").toLowerCase() === "true";
const uploadsDir = process.env.FTP_UPLOADS_DIR?.trim() || "pdn_new_website_uploads";
const publicBase = process.env.FTP_PUBLIC_BASE_URL?.trim() || "https://palawandailynews.com";

if (!host || !user || !password) {
  console.error("Missing FTP_HOST, FTP_USER, or FTP_PASSWORD in .env");
  process.exit(1);
}

async function enterDir(client, part) {
  try {
    await client.cd(part);
    return;
  } catch {
    /* not found */
  }
  try {
    await client.send(`MKD ${part}`);
  } catch {
    /* may already exist */
  }
  await client.cd(part);
}

const client = new Client(20_000);
try {
  await client.access({ host, port, user, password, secure });
  console.log("FTP login pwd:", await client.pwd());

  const pwd = (await client.pwd()).replace(/\\/g, "/");
  if (pwd === "/public_html" || pwd.endsWith("/public_html")) {
    await client.cd("..");
    console.log("Moved to site root:", await client.pwd());
  }

  const atRoot = await client.list();
  console.log(
    "Folders at site root:",
    atRoot.filter((x) => x.isDirectory).map((x) => x.name).join(", "),
  );

  await enterDir(client, uploadsDir);
  console.log("Upload target:", await client.pwd());
  console.log("Public URL base:", `${publicBase}/${uploadsDir}/`);
} catch (err) {
  console.error("FAIL:", err.message);
  process.exit(1);
} finally {
  client.close();
}
