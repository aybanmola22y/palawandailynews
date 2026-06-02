import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import type { StaffProfileRow } from "@/lib/supabase/database.types";
import { authorInitials, authorSlug } from "@/lib/author-profile";

type StaffProfilePatchInput = {
  name: string;
  profileTitle: string;
  quote: string;
  bio: string;
  badgeLabel: string;
};

function staffRowToClient(row: StaffProfileRow) {
  return {
    id: row.id,
    name: row.name,
    profileTitle: row.profile_title ?? "",
    quote: row.quote ?? "",
    bio: row.bio ?? "",
    badgeLabel: row.badge_label ?? "Palawan",
    avatar: row.avatar ?? authorInitials(row.name),
    updatedAt: Date.parse(row.updated_at) || Date.now(),
  };
}

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let body: StaffProfilePatchInput;
  try {
    body = (await request.json()) as StaffProfilePatchInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const patch: Partial<StaffProfileRow> = {
    name,
    slug: authorSlug(name),
    profile_title: body.profileTitle ?? "",
    quote: body.quote ?? "",
    bio: body.bio ?? "",
    badge_label: body.badgeLabel ?? "Palawan",
    avatar: authorInitials(name),
  };

  let { data, error } = await auth.service
    .from("staff_profiles")
    .update(patch as never)
    .eq("id", id)
    .select(
      "id, admin_user_id, slug, name, profile_title, quote, bio, badge_label, avatar, is_columnist, created_at, updated_at",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) {
    const upsertRow: Partial<StaffProfileRow> = {
      id,
      admin_user_id: null,
      is_columnist: false,
      ...patch,
    };

    ({ data, error } = await auth.service
      .from("staff_profiles")
      .upsert(upsertRow as never, { onConflict: "name" })
      .select(
        "id, admin_user_id, slug, name, profile_title, quote, bio, badge_label, avatar, is_columnist, created_at, updated_at",
      )
      .single());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) {
      return NextResponse.json(
        { error: "Failed to save staff profile" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(staffRowToClient(data));
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  const { error } = await auth.service.from("staff_profiles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}

