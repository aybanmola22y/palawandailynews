import { createHash } from "crypto";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ARTICLES_FILE = path.join(process.cwd(), "src", "data", "imported-articles.json");
const META_FILE = path.join(process.cwd(), "src", "data", "imported-articles.meta.json");

export async function writeImportMeta(articles) {
  const ids = articles.map((a) => a.id).sort().join("\n");
  const revision = createHash("sha256").update(ids || "empty").digest("hex").slice(0, 16);
  const meta = {
    revision,
    count: articles.length,
    updatedAt: new Date().toISOString(),
  };
  await writeFile(META_FILE, JSON.stringify(meta, null, 2), "utf8");
  return meta;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const raw = await readFile(ARTICLES_FILE, "utf8");
  const articles = JSON.parse(raw);
  const meta = await writeImportMeta(Array.isArray(articles) ? articles : []);
  console.log(`Import meta: ${meta.count} articles, revision ${meta.revision}`);
}
