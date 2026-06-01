/**
 * Create a Supabase Auth user and link to admin_users.auth_user_id.
 *
 * Usage (requires .env with SUPABASE_SERVICE_ROLE_KEY):
 *   node --env-file=.env scripts/seed-admin-auth.mjs elena@palawandaily.com YourPassword123
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error(
    "Usage: node --env-file=.env scripts/seed-admin-auth.mjs <email> <password>",
  );
  process.exit(1);
}

if (!url?.trim() || !serviceKey?.trim()) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing } = await admin
  .from("admin_users")
  .select("id, name, auth_user_id")
  .ilike("email", email)
  .maybeSingle();

if (!existing) {
  console.error(`No admin_users row found for ${email}. Run migrations / seed first.`);
  process.exit(1);
}

let authUserId = existing.auth_user_id;

if (!authUserId) {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    console.error("createUser failed:", createError.message);
    process.exit(1);
  }

  authUserId = created.user.id;
  console.log("Created Supabase Auth user:", authUserId);
} else {
  console.log("Auth user already linked:", authUserId);
  const { error: updateError } = await admin.auth.admin.updateUserById(authUserId, {
    password,
  });
  if (updateError) {
    console.warn("Password update skipped:", updateError.message);
  }
}

const { error: linkError } = await admin
  .from("admin_users")
  .update({ auth_user_id: authUserId })
  .eq("id", existing.id);

if (linkError) {
  console.error("Link failed:", linkError.message);
  process.exit(1);
}

console.log(`Linked ${existing.name} (${email}) → auth.users ${authUserId}`);
console.log("You can now sign in at /admin/login");
