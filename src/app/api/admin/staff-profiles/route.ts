import { NextRequest, NextResponse } from "next/server";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import type { StaffProfileRow } from "@/lib/supabase/database.types";
import { authorInitials, authorSlug } from "@/lib/author-profile";

type StaffProfileCreateInput = {
  id?: string;
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

export async function GET() {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { data, error } = await auth.service
    .from("staff_profiles")
    .select(
      "id, admin_user_id, slug, name, profile_title, quote, bio, badge_label, avatar, is_columnist, created_at, updated_at",
    )
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(staffRowToClient));
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  let body: StaffProfileCreateInput;
  try {
    body = (await request.json()) as StaffProfileCreateInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const id = body.id?.trim() || `S-${Date.now()}`;
  const slug = authorSlug(name);

  const row: Partial<StaffProfileRow> = {
    id,
    name,
    slug,
    profile_title: body.profileTitle ?? "",
    quote: body.quote ?? "",
    bio: body.bio ?? "",
    badge_label: body.badgeLabel ?? "Palawan",
    avatar: authorInitials(name),
    admin_user_id: null,
    is_columnist: false,
  };

  // Upsert on `name` so repeated adds don't create duplicates.
  const { data, error } = await auth.service
    .from("staff_profiles")
    .upsert(row as never, { onConflict: "name" })
    .select(
      "id, admin_user_id, slug, name, profile_title, quote, bio, badge_label, avatar, is_columnist, created_at, updated_at",
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Failed to create staff profile" }, { status: 500 });

  return NextResponse.json(staffRowToClient(data));
}

