import type { Article } from "@/store/articles-context";
import type { AdminUser } from "@/store/users-context";
import type { StaffProfile } from "@/store/staff-context";
import {
  defaultAuthorProfile,
  type AuthorPublicProfile,
} from "@/lib/author-profile-defaults";
import {
  isGenericPublicationAuthor as isGenericAuthor,
  resolveAuthorDisplayName,
  getVisibleAuthorName,
} from "@/lib/author-resolve";

export { getVisibleAuthorName, resolveAuthorDisplayName } from "@/lib/author-resolve";

function normalizeName(name: string) {
  return resolveAuthorDisplayName(name).trim().toLowerCase().replace(/\s+/g, " ");
}

/** House byline / publication credit — not a WP author to look up. */
export function isGenericPublicationAuthor(name: string) {
  return isGenericAuthor(name);
}

export function findUserByAuthorName(
  users: AdminUser[],
  authorName: string,
): AdminUser | undefined {
  if (!authorName.trim()) return undefined;
  const target = normalizeName(authorName);
  return users.find((u) => normalizeName(u.name) === target);
}

export function findStaffByAuthorName(
  staff: StaffProfile[],
  authorName: string,
): StaffProfile | undefined {
  if (!authorName.trim()) return undefined;
  const target = normalizeName(authorName);
  return staff.find((s) => normalizeName(s.name) === target);
}

export function getArticlesByAuthor(
  articles: Article[],
  authorName: string,
  options?: { publishedOnly?: boolean },
): Article[] {
  if (!authorName.trim()) return [];
  const target = normalizeName(authorName);
  const publishedOnly = options?.publishedOnly ?? true;

  return articles.filter((a) => {
    if (normalizeName(a.author) !== target) return false;
    if (publishedOnly && a.status && a.status !== "Published") return false;
    return true;
  });
}

export function formatAuthorDisplayName(name: string) {
  return resolveAuthorDisplayName(name);
}

export function authorInitials(name: string) {
  return formatAuthorDisplayName(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function authorSlug(name: string) {
  return formatAuthorDisplayName(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function authorProfilePath(name: string) {
  return `/author/${authorSlug(name)}`;
}

/** Resolve slug to display name from team users and article bylines. */
export function resolveAuthorNameBySlug(
  slug: string,
  users: AdminUser[],
  staff: StaffProfile[],
  articles: Article[],
): string | null {
  const target = slug.trim().toLowerCase();
  if (!target) return null;

  const names = new Set<string>();
  for (const user of users) {
    if (user.name.trim()) names.add(user.name);
  }
  for (const member of staff) {
    if (member.name.trim()) names.add(member.name);
  }
  for (const article of articles) {
    if (article.author?.trim()) names.add(article.author);
  }

  for (const name of names) {
    if (authorSlug(name) === target) return name;
  }
  return null;
}

export function authorBio(name: string, role?: string) {
  if (role) {
    return `${name} covers news and features for Palawan Daily News as ${role.toLowerCase()}.`;
  }
  return `${name} contributes reporting and features to Palawan Daily News.`;
}

/** Public-facing profile fields for the author page. */
export function resolveAuthorPublicProfile(
  authorName: string,
  user: AdminUser | undefined,
  staff: StaffProfile | undefined,
  articleCategories: string[],
): AuthorPublicProfile & { name: string; email?: string; avatar: string } {
  const defaults = defaultAuthorProfile(authorName, user?.role);
  const beats =
    articleCategories.length > 0
      ? articleCategories.slice(0, 3).join(", ")
      : "local news and public affairs";
  const first = authorName.split(" ")[0] || authorName;

  const bio =
    user?.bio?.trim() ||
    staff?.bio?.trim() ||
    `${authorName} is a journalist with Palawan Daily News, covering ${beats}. With years of experience in regional reporting, ${first} brings depth, context, and accountability to the stories that shape island communities.`;

  return {
    name: authorName,
    email: user?.email,
    avatar: user?.avatar ?? staff?.avatar ?? authorInitials(authorName),
    profileTitle:
      user?.profileTitle?.trim() ||
      staff?.profileTitle?.trim() ||
      defaults.profileTitle,
    quote: user?.quote?.trim() || staff?.quote?.trim() || defaults.quote,
    bio,
    badgeLabel:
      user?.badgeLabel?.trim() || staff?.badgeLabel?.trim() || defaults.badgeLabel,
  };
}
