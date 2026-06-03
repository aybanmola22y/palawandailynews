import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/security/request-guard";
import { isValidArticleId, isValidUuid } from "@/lib/security/safe-url";

export function parseArticleRouteId(
  id: string,
): { ok: true; id: string } | { ok: false; response: NextResponse } {
  const trimmed = id.trim();
  if (!isValidArticleId(trimmed)) {
    return { ok: false, response: invalidIdResponse("Invalid article id") };
  }
  return { ok: true, id: trimmed };
}

export function parseUuidRouteId(
  id: string,
): { ok: true; id: string } | { ok: false; response: NextResponse } {
  const trimmed = id.trim();
  if (!isValidUuid(trimmed)) {
    return { ok: false, response: invalidIdResponse("Invalid resource id") };
  }
  return { ok: true, id: trimmed };
}
