import type { UserRole } from "@/store/users-context";

export type AuthorPublicProfile = {
  profileTitle: string;
  quote: string;
  bio: string;
  badgeLabel: string;
};

export function defaultAuthorProfile(
  name: string,
  role: UserRole | string = "Writer",
): AuthorPublicProfile {
  const first = name.split(" ")[0] || name;

  const profileTitle =
    role === "Super Admin"
      ? "Staff Reporter & Investigative Journalist"
      : role === "Editor"
        ? "Senior Editor & Features Writer"
        : role === "Moderator"
          ? "Community & Legal Affairs Editor"
          : "Staff Reporter";

  return {
    profileTitle,
    quote:
      "Passionate about uncovering stories that matter and giving voice to communities across Palawan and the MIMAROPA region.",
    bio: `${name} is a journalist with Palawan Daily News, covering local news, public affairs, and community stories across the archipelago. With a commitment to rigorous reporting, ${first} brings depth and context to the region's most important issues.`,
    badgeLabel: "Palawan",
  };
}
