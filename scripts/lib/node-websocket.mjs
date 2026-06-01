/** Polyfill WebSocket for Node.js < 22 (must import before @supabase/supabase-js). */
import ws from "ws";

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = ws;
}

export { ws };
