/**
 * Remove the mistaken `public_html` folder inside the site root (not hPanel's public_html).
 * Run: node --env-file=.env scripts/remove-nested-public-html.mjs
 */
import { Client } from "basic-ftp";

async function removeDirRecursive(client, dirName) {
  await client.cd(dirName);
  for (const item of await client.list()) {
    if (item.name === "." || item.name === "..") continue;
    if (item.isDirectory) {
      await removeDirRecursive(client, item.name);
    } else {
      await client.remove(item.name);
      console.log("  deleted file:", item.name);
    }
  }
  await client.cd("..");
  await client.removeDir(dirName);
}

const client = new Client(120_000);
try {
  await client.access({
    host: process.env.FTP_HOST,
    port: Number.parseInt(process.env.FTP_PORT || "21", 10),
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: (process.env.FTP_SECURE || "").toLowerCase() === "true",
  });

  await client.cd("/");
  console.log("Site root:", await client.pwd());

  const list = await client.list();
  const nested = list.find((x) => x.name === "public_html" && x.isDirectory);
  if (!nested) {
    console.log("No nested public_html folder — already clean.");
    process.exit(0);
  }

  console.log("Emptying nested public_html/ ...");
  await removeDirRecursive(client, "public_html");
  console.log("Removed nested public_html folder.");
} catch (err) {
  if (err.message?.includes("Permission denied")) {
    console.error(
      "FTP cannot delete the empty folder (permission denied).",
      "Open Hostinger File Manager → public_html → delete the inner public_html folder manually (it should be empty now).",
    );
  } else {
    console.error("FAIL:", err.message);
  }
  process.exit(1);
} finally {
  client.close();
}
