import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ACTIVE_NAMES = [
  "Hanna Camella Zapanta",
  "Harthwell Capistrano",
  "Lance Factor",
  "Gerardo Reyes Jr.",
];

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

console.log("Keeping staff profiles:", ACTIVE_NAMES.join(", "));

// 1) Ensure the 4 active staff exist (upsert by name).
const upsertRows = ACTIVE_NAMES.map((name) => ({
  id: `S-active-${slugify(name)}`,
  admin_user_id: null,
  slug: slugify(name),
  name,
  profile_title: "",
  quote: "",
  bio: "",
  badge_label: "Palawan",
  avatar: name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  is_columnist: false,
}));

{
  const { error } = await supabase
    .from("staff_profiles")
    .upsert(upsertRows, { onConflict: "name" });
  if (error) throw error;
}

// 2) Delete everything else except columnists, and except the active staff names.
{
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, name, is_columnist");
  if (error) throw error;

  const keep = new Set(ACTIVE_NAMES.map((n) => n.toLowerCase()));
  const toDelete = (data ?? [])
    .filter((r) => !r.is_columnist)
    .filter((r) => !keep.has((r.name ?? "").toLowerCase()))
    .map((r) => r.id);

  if (toDelete.length) {
    console.log("Deleting non-active non-columnist rows:", toDelete.length);
    const { error: delErr } = await supabase
      .from("staff_profiles")
      .delete()
      .in("id", toDelete);
    if (delErr) throw delErr;
  } else {
    console.log("No extra non-columnist rows to delete.");
  }
}

// 3) Print counts.
{
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("name, is_columnist")
    .order("is_columnist", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  console.log("Remaining staff_profiles rows:", data?.length ?? 0);
  for (const row of data ?? []) {
    console.log("-", row.is_columnist ? "[columnist]" : "[staff]", row.name);
  }
}

