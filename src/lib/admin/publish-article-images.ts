import { uploadAdminImage } from "@/lib/admin/upload-image";

const BLOB_SRC_RE = /blob:[^"'\s)>]+/g;

/** Local preview only — files upload to Hostinger when the article is saved. */
export async function publishArticleImages(options: {
  heroFile: File | null;
  heroUrl: string;
  contentHtml: string;
  pendingFiles: Map<string, File>;
}): Promise<{ heroImage: string; contentHtml: string }> {
  let heroImage = options.heroUrl.trim();
  if (options.heroFile) {
    heroImage = await uploadAdminImage(options.heroFile, "articles");
  }

  let contentHtml = options.contentHtml;
  const blobUrls = [...new Set(contentHtml.match(BLOB_SRC_RE) ?? [])];

  for (const blobUrl of blobUrls) {
    const file = options.pendingFiles.get(blobUrl);
    if (!file) {
      throw new Error(
        "A draft image is missing. Remove it and add the image again, then save.",
      );
    }
    const url = await uploadAdminImage(file, "inline");
    contentHtml = contentHtml.split(blobUrl).join(url);
  }

  return { heroImage, contentHtml };
}

export function createPendingBlobUrl(file: File): string {
  return URL.createObjectURL(file);
}

export function revokePendingBlobUrl(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
