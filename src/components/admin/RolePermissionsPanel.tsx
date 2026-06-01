import { Check } from "lucide-react";
import type { UserRole } from "@/store/users-context";

const ROLES: UserRole[] = ["Super Admin", "Editor", "Writer", "Moderator"];

const ROLE_BADGE: Record<UserRole, string> = {
  "Super Admin":
    "bg-foreground text-background border-foreground/15 dark:bg-[#f2f0eb] dark:text-[#0A0A09] dark:border-white/10",
  Editor: "bg-card text-foreground border-border",
  Writer: "bg-card text-foreground border-border",
  Moderator: "bg-card text-foreground border-border",
};

const ROLE_INFO: Record<
  UserRole,
  { description: string; permissions: string[] }
> = {
  "Super Admin": {
    description: "Full control of the newsroom CMS and team settings.",
    permissions: ["All sections", "User management", "Publish & delete"],
  },
  Editor: {
    description: "Manages daily publishing workflow and reviews submissions.",
    permissions: ["Articles & media", "Ads", "Publish content"],
  },
  Writer: {
    description: "Creates and edits stories; drafts go to review.",
    permissions: ["Own articles", "Media uploads", "Save drafts"],
  },
  Moderator: {
    description: "Oversees comments, legal notices, and community content.",
    permissions: ["Legal section", "User reports", "Content flags"],
  },
};

export function RolePermissionsPanel({
  roleCounts,
}: {
  roleCounts: Record<UserRole, number>;
}) {
  return (
    <div className="bg-white dark:bg-[#1A1A18] border border-border overflow-hidden">
      <div className="px-5 py-5 border-b border-border bg-[#FAFAF8] dark:bg-[#111111]">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
          Newsroom access
        </p>
        <h2 className="font-serif text-[22px] font-bold text-foreground leading-tight">
          Role Permissions
        </h2>
        <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
          Assign roles when adding team members. Each level unlocks specific
          areas of the CMS.
        </p>
      </div>

      <ul className="divide-y divide-border">
        {ROLES.map((role) => (
          <li key={role} className="group">
            <div className="flex-1 px-5 py-4 transition-colors group-hover:bg-[#FAFAF8]/80 dark:group-hover:bg-[#111111]/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span
                    className={`inline-block rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] border ${ROLE_BADGE[role]}`}
                  >
                    {role}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap pt-1">
                    {roleCounts[role]} {roleCounts[role] === 1 ? "user" : "users"}
                  </span>
                </div>
                <p className="text-[13px] text-muted-foreground leading-snug mb-3">
                  {ROLE_INFO[role].description}
                </p>
                <ul className="space-y-2">
                  {ROLE_INFO[role].permissions.map((permission) => (
                    <li
                      key={permission}
                      className="flex items-center gap-2.5 text-[12px] text-foreground/80"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                        <Check
                          className="h-3 w-3 text-muted-foreground"
                          strokeWidth={2.5}
                        />
                      </span>
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
