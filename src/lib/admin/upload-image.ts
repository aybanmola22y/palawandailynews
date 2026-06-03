export type AdminImageFolder = "articles" | "ads" | "inline";

export async function uploadAdminImage(
  file: File,
  folder: AdminImageFolder,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const res = await fetch("/api/admin/upload-image", {
    method: "POST",
    body: form,
    credentials: "include",
  });

  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  if (!data.url) {
    throw new Error("Upload succeeded but no URL was returned.");
  }

  return data.url;
}
