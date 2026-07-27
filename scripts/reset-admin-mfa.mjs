/**
 * Remove all MFA (TOTP) factors for an admin so they can sign in with password only.
 *
 * Usage:
 *   npm run reset-admin-mfa -- you@example.com
 *
 * Pair with ADMIN_MFA_DISABLED=true in .env if you also want to skip forced re-enrollment.
 */
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email) {
  console.error("Usage: npm run reset-admin-mfa -- <email>");
  process.exit(1);
}

if (!url?.trim() || !serviceKey?.trim()) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: row, error: rowError } = await admin
  .from("admin_users")
  .select("id, name, auth_user_id")
  .ilike("email", email)
  .maybeSingle();

if (rowError) {
  console.error("Lookup failed:", rowError.message);
  process.exit(1);
}

if (!row?.auth_user_id) {
  console.error(`No linked auth user for ${email}.`);
  process.exit(1);
}

const userId = row.auth_user_id;
const { data: listed, error: listError } = await admin.auth.admin.mfa.listFactors({
  userId,
});

if (listError) {
  console.error("listFactors failed:", listError.message);
  process.exit(1);
}

const factors = listed?.factors ?? [];
if (factors.length === 0) {
  console.log(`No MFA factors on ${row.name} (${email}). Password login should work.`);
  process.exit(0);
}

for (const factor of factors) {
  const { error: delError } = await admin.auth.admin.mfa.deleteFactor({
    id: factor.id,
    userId,
  });
  if (delError) {
    console.error(`Failed to delete factor ${factor.id}:`, delError.message);
    process.exit(1);
  }
  console.log(`Deleted MFA factor ${factor.id} (${factor.factor_type}, ${factor.status})`);
}

console.log(`Cleared MFA for ${row.name} (${email}). Sign in at /admin/login with password only.`);
console.log(
  "Tip: set ADMIN_MFA_DISABLED=true in .env to skip forced re-enrollment until you have a new phone.",
);
