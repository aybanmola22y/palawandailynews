import type { UserRole } from "@/store/users-context";

const ROLES: UserRole[] = ["Super Admin", "Editor", "Writer", "Moderator"];

const ROLE_BAR: Record<UserRole, string> = {
  "Super Admin": "bg-[#C41E3A]",
  Editor: "bg-[#0055FF]",
  Writer: "bg-[#6B6B66]",
  Moderator: "bg-[#B45309]",
};

export function TeamBreakdownPanel({
  roleCounts,
  total,
}: {
  roleCounts: Record<UserRole, number>;
  total: number;
}) {
  return (
    <div className="bg-white dark:bg-[#1A1A18] border border-border overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-serif text-lg font-bold text-foreground">
          Team Breakdown
        </h2>
        <p className="text-[12px] text-muted-foreground mt-1">
          {total} active {total === 1 ? "account" : "accounts"} on this desk
        </p>
      </div>
      <div className="p-5 space-y-4">
        {ROLES.map((role) => {
          const count = roleCounts[role];
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={role}>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[12px] font-medium text-foreground">
                  {role}
                </span>
                <span className="text-[12px] tabular-nums text-muted-foreground">
                  <span className="font-semibold text-foreground">{count}</span>
                  <span className="mx-1">·</span>
                  {pct}%
                </span>
              </div>
              <div className="h-2 bg-[#EFEFED] dark:bg-[#252524] overflow-hidden">
                <div
                  className={`h-full ${ROLE_BAR[role]} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
