import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import { ensureAdminUserForAuthUser } from "@/lib/admin-auth";
import {
  adminRowFromClientInput,
  fetchAdminUsersForDashboard,
  mapAdminUserRowToClient,
} from "@/lib/admin-users";
import type { UserRole } from "@/store/users-context";

export async function GET() {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const users = await fetchAdminUsersForDashboard();
    return NextResponse.json(users);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load users";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  let body: { name?: string; email?: string; role?: UserRole; password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const role = body.role ?? "Writer";
  const password = body.password?.trim() ?? "";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 },
    );
  }

  const validRoles: UserRole[] = ["Super Admin", "Editor", "Writer", "Moderator"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  const { service } = auth;

  const { data: existingAuth } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const emailTaken = existingAuth?.users?.some(
    (u) => u.email?.trim().toLowerCase() === email,
  );
  if (emailTaken) {
    return NextResponse.json(
      { error: "A Supabase Auth user with this email already exists." },
      { status: 409 },
    );
  }

  const { data: createdAuth, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  });

  if (authError || !createdAuth.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create Auth user." },
      { status: 500 },
    );
  }

  const row = await ensureAdminUserForAuthUser(createdAuth.user);
  if (!row) {
    return NextResponse.json(
      { error: "Auth user created but admin_users row could not be saved." },
      { status: 500 },
    );
  }

  const { data: updated, error: updateError } = await service
    .from("admin_users")
    .update({
      name,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(
    mapAdminUserRowToClient(updated, createdAuth.user.last_sign_in_at),
    { status: 201 },
  );
}
