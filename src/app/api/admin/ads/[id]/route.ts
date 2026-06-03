import { NextRequest, NextResponse } from "next/server";
import { adChangesToRow, rowToAd } from "@/lib/ads/map-ad-row";
import { requireAdminRouteAuth } from "@/lib/admin-route-auth";
import type { Ad } from "@/store/ads-context";
import { parseArticleRouteId } from "@/lib/security/route-params";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminRouteAuth();
  if (auth instanceof NextResponse) return auth;

  const { id: rawId } = await params;
  const parsed = parseArticleRouteId(rawId);
  if (!parsed.ok) return parsed.response;
  const { id } = parsed;

  let changes: Partial<Ad>;
  try {
    changes = (await request.json()) as Partial<Ad>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const patch = adChangesToRow(changes);
  const { data, error } = await auth.service
    .from("ads")
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Advertisement not found" }, { status: 404 });
  }

  return NextResponse.json(rowToAd(data));
}
