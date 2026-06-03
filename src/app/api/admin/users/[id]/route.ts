import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import type { AdminAuthClient } from "@/lib/admin-auth";
import { mapAdminUserRowToClient } from "@/lib/admin-users";
import type { UserRole } from "@/store/users-context";
import { parseUuidRouteId } from "@/lib/security/route-params";

type RouteParams = { params: Promise<{ id: string }> };

async function countSuperAdmins(service: AdminAuthClient) {
  const { count } = await service
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "Super Admin");
  return count ?? 0;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { id: rawId } = await params;
  const parsed = parseUuidRouteId(rawId);
  if (!parsed.ok) return parsed.response;
  const { id } = parsed;

  let body: { name?: string; email?: string; role?: UserRole };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { service } = auth;

  const { data: existing, error: loadError } = await service
    .from("admin_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const nextRole = body.role ?? existing.role;
  if (existing.role === "Super Admin" && nextRole !== "Super Admin") {
    const superCount = await countSuperAdmins(service);
    if (superCount <= 1) {
      return NextResponse.json(
        { error: "At least one Super Admin must remain." },
        { status: 400 },
      );
    }
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.email !== undefined) patch.email = body.email.trim().toLowerCase();
  if (body.role !== undefined) patch.role = body.role;

  const { data, error } = await service
    .from("admin_users")
    .update(patch as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing.auth_user_id && (body.name !== undefined || body.role !== undefined)) {
    const meta: Record<string, string> = {};
    if (body.name !== undefined) meta.name = body.name.trim();
    if (body.role !== undefined) meta.role = body.role;
    await service.auth.admin.updateUserById(existing.auth_user_id, {
      user_metadata: meta,
    });
  }

  if (existing.auth_user_id && body.email !== undefined) {
    await service.auth.admin.updateUserById(existing.auth_user_id, {
      email: body.email.trim().toLowerCase(),
    });
  }

  return NextResponse.json(mapAdminUserRowToClient(data));
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { id: rawId } = await params;
  const parsed = parseUuidRouteId(rawId);
  if (!parsed.ok) return parsed.response;
  const { id } = parsed;
  const { service } = auth;

  const { data: existing, error: loadError } = await service
    .from("admin_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (existing.role === "Super Admin") {
    const superCount = await countSuperAdmins(service);
    if (superCount <= 1) {
      return NextResponse.json(
        { error: "At least one Super Admin must remain." },
        { status: 400 },
      );
    }
  }

  const { error: deleteRowError } = await service
    .from("admin_users")
    .delete()
    .eq("id", id);

  if (deleteRowError) {
    return NextResponse.json({ error: deleteRowError.message }, { status: 500 });
  }

  if (existing.auth_user_id) {
    await service.auth.admin.deleteUser(existing.auth_user_id);
  }

  return new NextResponse(null, { status: 204 });
}
