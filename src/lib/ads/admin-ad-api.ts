import type { Ad } from "@/store/ads-context";

async function parseError(res: Response) {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function patchAdminAd(
  id: string,
  changes: Partial<Ad>,
): Promise<Ad> {
  const res = await fetch(`/api/admin/ads/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as Ad;
}
