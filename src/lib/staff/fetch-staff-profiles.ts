import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { authorInitials } from "@/lib/author-profile";

export type PublicStaffProfile = {
  id: string;
  name: string;
  profileTitle: string;
  quote: string;
  bio: string;
  badgeLabel: string;
  avatar: string;
  updatedAt: number;
};

export async function fetchStaffProfilesFromSupabase(
  client: SupabaseClient<Database>,
): Promise<PublicStaffProfile[]> {
  const { data, error } = await client
    .from("staff_profiles")
    .select("id, name, profile_title, quote, bio, badge_label, avatar, updated_at")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    profileTitle: row.profile_title ?? "",
    quote: row.quote ?? "",
    bio: row.bio ?? "",
    badgeLabel: row.badge_label ?? "Palawan",
    avatar: row.avatar ?? authorInitials(row.name),
    updatedAt: Date.parse(row.updated_at) || Date.now(),
  }));
}
