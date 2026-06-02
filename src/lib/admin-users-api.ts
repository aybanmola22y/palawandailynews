import type { AdminUser, UserRole } from "@/store/users-context";

async function parseError(res: Response) {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    return res.statusText || "Request failed";
  }
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/admin/users", { credentials: "include" });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as AdminUser[];
}

export type CreateAdminUserInput = {
  name: string;
  email: string;
  role: UserRole;
  password: string;
};

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUser> {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as AdminUser;
}

export async function patchAdminUser(
  id: string,
  changes: Partial<Pick<AdminUser, "name" | "email" | "role">>,
): Promise<AdminUser> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as AdminUser;
}

export async function removeAdminUser(id: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await parseError(res));
}
