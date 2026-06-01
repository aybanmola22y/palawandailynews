import "./node-websocket.mjs";
import { Agent, fetch as undiciFetch } from "undici";
import { createClient } from "@supabase/supabase-js";
import { ws } from "./node-websocket.mjs";
import { getSupabaseAdmin } from "./article-import.mjs";

const fetchAgent = new Agent({
  connectTimeout: 60_000,
  headersTimeout: 120_000,
  bodyTimeout: 300_000,
});

function nodeFetch(input, init) {
  return undiciFetch(input, {
    ...init,
    dispatcher: fetchAgent,
  });
}

/** Service-role client for Node import scripts. */
export function createSupabaseAdminClient() {
  const { url, key } = getSupabaseAdmin();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { transport: ws },
    global: { fetch: nodeFetch },
  });
}
