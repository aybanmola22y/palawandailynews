import type { User } from "@supabase/supabase-js";
import type { AdminUserRow } from "@/lib/supabase/database.types";
import type { UserRole, AdminUser } from "@/store/users-context";
import { defaultAuthorProfile } from "@/lib/author-profile-defaults";
import { ensureAdminUserForAuthUser } from "@/lib/admin-auth";
import { authUserHasVerifiedTotpEnrolled } from "@/lib/admin-mfa";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatAuthLastActive(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function mapAdminUserRowToClient(
  row: AdminUserRow,
  lastSignInAt?: string | null,
  authenticatorEnrolled = false,
): AdminUser {
  const role = row.role as UserRole;
  const defaults = defaultAuthorProfile(row.name, role);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role,
    lastActive: lastSignInAt
      ? formatAuthLastActive(lastSignInAt)
      : row.last_active || "—",
    avatar: row.avatar || initials(row.name),
    profileTitle: row.profile_title || defaults.profileTitle,
    quote: row.quote || defaults.quote,
    bio: row.bio || defaults.bio,
    badgeLabel: row.badge_label || defaults.badgeLabel,
    updatedAt: Date.parse(row.updated_at) || Date.now(),
    authUserId: row.auth_user_id ?? undefined,
    authenticatorEnrolled: row.auth_user_id ? authenticatorEnrolled : false,
  };
}

export async function listAllAuthUsers() {
  const service = getSupabaseServiceClient();
  if (!service) return [] as User[];

  const users: User[] = [];
  let page = 1;

  while (page < 50) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }

  return users;
}

/** Create or link `admin_users` rows for every Supabase Auth user. */
export async function syncAuthUsersIntoAdminTable() {
  const service = getSupabaseServiceClient();
  if (!service) {
    throw new Error("Supabase service role is not configured.");
  }

  const authUsers = await listAllAuthUsers();
  for (const authUser of authUsers) {
    await ensureAdminUserForAuthUser(authUser);
  }
  return authUsers;
}

export async function fetchAdminUsersForDashboard(): Promise<AdminUser[]> {
  const service = getSupabaseServiceClient();
  if (!service) {
    throw new Error("Supabase service role is not configured.");
  }

  const authUsers = await syncAuthUsersIntoAdminTable();

  const signInByAuthId = new Map(
    authUsers.map((u) => [u.id, u.last_sign_in_at ?? null]),
  );

  const totpEnrolledByAuthId = new Map<string, boolean>();
  await Promise.all(
    authUsers.map(async (authUser) => {
      const enrolled = await authUserHasVerifiedTotpEnrolled(service, authUser.id);
      totpEnrolledByAuthId.set(authUser.id, enrolled);
    }),
  );

  const { data: rows, error } = await service
    .from("admin_users")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return (rows ?? []).map((row) =>
    mapAdminUserRowToClient(
      row,
      row.auth_user_id ? signInByAuthId.get(row.auth_user_id) : null,
      row.auth_user_id
        ? (totpEnrolledByAuthId.get(row.auth_user_id) ?? false)
        : false,
    ),
  );
}

export function adminRowFromClientInput(input: {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  authUserId?: string | null;
}): Omit<AdminUserRow, "created_at" | "updated_at"> {
  const defaults = defaultAuthorProfile(input.name, input.role);
  return {
    id: input.id ?? `U-${Date.now()}`,
    auth_user_id: input.authUserId ?? null,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    last_active: "Just now",
    avatar: initials(input.name),
    profile_title: defaults.profileTitle,
    quote: defaults.quote,
    bio: defaults.bio,
    badge_label: defaults.badgeLabel,
  };
}
