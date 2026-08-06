import { NextResponse } from "next/server";
import { invalidIdResponse } from "@/lib/security/request-guard";
import {
  articleIdLookupCandidates,
  isValidArticleId,
  isValidUuid,
} from "@/lib/security/safe-url";

export function parseArticleRouteId(
  id: string,
): { ok: true; id: string } | { ok: false; response: NextResponse } {
  const candidates = articleIdLookupCandidates(id);
  const match = candidates.find(isValidArticleId);
  if (!match) {
    return { ok: false, response: invalidIdResponse("Invalid article id") };
  }
  return { ok: true, id: match };
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
