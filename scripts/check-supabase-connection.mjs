import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

function maskUrl(u) {
  if (!u) return "MISSING";
  const m = u.match(/https:\/\/([^.]+)\.supabase\.co/i);
  return m ? `https://${m[1]}.supabase.co` : u;
}

console.log("Project URL:", maskUrl(url));
console.log("Anon key:", anon ? `set (${anon.length} chars)` : "MISSING");
console.log("Service role key:", service ? `set (${service.length} chars)` : "MISSING");

if (!url || !anon) {
  console.error("\nCannot test: missing URL or anon key.");
  process.exit(1);
}

const anonClient = createClient(url, anon);
const art = await anonClient
  .from("articles")
  .select("id", { count: "exact", head: true });
console.log(
  "\nAnon → articles:",
  art.error ? `FAIL — ${art.error.message}` : `OK (${art.count ?? 0} published rows visible)`,
);

if (!service) {
  console.log("\nService role: MISSING — admin user sync and article writes will not work.");
  process.exit(0);
}

const svc = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const auth = await svc.auth.admin.listUsers({ page: 1, perPage: 20 });
console.log(
  "Service → Auth users:",
  auth.error ? `FAIL — ${auth.error.message}` : `OK (${auth.data?.users?.length ?? 0} users)`,
);

const admins = await svc.from("admin_users").select("id, email, name, role").order("name");
console.log(
  "Service → admin_users:",
  admins.error ? `FAIL — ${admins.error.message}` : `OK (${admins.data?.length ?? 0} rows)`,
);

if (auth.data?.users?.length) {
  console.log("\nAuth accounts:");
  for (const u of auth.data.users) {
    console.log(`  • ${u.email ?? "(no email)"} — confirmed: ${Boolean(u.email_confirmed_at)}`);
  }
}

if (admins.data?.length) {
  console.log("\nCMS admin_users:");
  for (const row of admins.data) {
    console.log(`  • ${row.email} — ${row.role} — ${row.name}`);
  }
}

console.log("\nDone.");
