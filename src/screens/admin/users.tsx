"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useUsers, UserRole, type AdminUser } from "@/store/users-context";
import { useArticles } from "@/store/articles-context";
import { useToast } from "@/hooks/use-toast";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Search, ExternalLink } from "lucide-react";
import { defaultAuthorProfile } from "@/lib/author-profile-defaults";
import { RolePermissionsPanel } from "@/components/admin/RolePermissionsPanel";
import { TeamBreakdownPanel } from "@/components/admin/TeamBreakdownPanel";

const ROLES: UserRole[] = ["Super Admin", "Editor", "Writer", "Moderator"];

const ROLE_STYLES: Record<UserRole, string> = {
  "Super Admin": "bg-[#C41E3A]/10 text-[#C41E3A]",
  Editor: "bg-[#0055FF]/10 text-[#0055FF]",
  Writer: "bg-muted text-muted-foreground",
  Moderator: "bg-[#F5A623]/10 text-[#F5A623]",
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

type FormState = {
  name: string;
  email: string;
  role: UserRole;
};

const emptyForm = (): FormState => ({
  name: "",
  email: "",
  role: "Writer",
  ...defaultAuthorProfile("", "Writer"),
});

function userToForm(user: AdminUser): FormState {
  return {
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role,
  };
}

export default function AdminUsers() {
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const { articles } = useArticles();
  const { toast } = useToast();

  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All Roles" | UserRole>("All Roles");

  const articlesByAuthor = useMemo(() => {
    const map: Record<string, number> = {};
    articles.forEach((a) => {
      if (a.author) map[a.author] = (map[a.author] ?? 0) + 1;
    });
    return map;
  }, [articles]);

  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      "Super Admin": 0,
      Editor: 0,
      Writer: 0,
      Moderator: 0,
    };
    users.forEach((u) => {
      counts[u.role]++;
    });
    return counts;
  }, [users]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
    const matchRole = roleFilter === "All Roles" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  function openAdd() {
    setForm(emptyForm());
    setEditingId(null);
    setModal("add");
  }

  function openEdit(id: string) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    setForm(userToForm(user));
    setEditingId(id);
    setModal("edit");
  }

  function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast({
        title: "Missing fields",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }

    if (modal === "add") {
      addUser(form);
      toast({ title: "User added", description: `${form.name} was added to the team.` });
    } else if (modal === "edit" && editingId) {
      updateUser(editingId, form);
      toast({ title: "User updated", description: `${form.name}'s profile was saved.` });
    }

    setModal(null);
    setEditingId(null);
    setForm(emptyForm());
  }

  function handleDelete() {
    if (!deleteId) return;
    const user = users.find((u) => u.id === deleteId);
    const ok = deleteUser(deleteId);
    setDeleteId(null);
    if (!ok) {
      toast({
        title: "Cannot remove user",
        description: "At least one Super Admin must remain on the team.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "User removed",
      description: user ? `${user.name} was removed.` : "User was removed.",
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-[32px] font-bold text-foreground">Admin Users</h1>
          <p className="text-[14px] text-muted-foreground mt-1 max-w-xl">
            Manage CMS login accounts, roles, and access levels. Public-facing
            author profiles are managed under <strong>Staff</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-[#C41E3A] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-widest hover:bg-[#A01830] transition-colors shrink-0"
        >
          Add Admin
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Team members" value={users.length} hint="Active CMS accounts" />
        <AdminStatCard
          label="Super admins"
          value={roleCounts["Super Admin"]}
          accent="primary"
          hint="Required for full access"
        />
        <AdminStatCard
          label="Editors"
          value={roleCounts.Editor}
          accent="success"
          hint="Publishing & review"
        />
        <AdminStatCard
          label="Writers"
          value={roleCounts.Writer}
          hint={`${roleCounts.Moderator} moderator${roleCounts.Moderator !== 1 ? "s" : ""}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
        <div className="bg-white dark:bg-[#1A1A18] border border-border flex flex-col min-w-0">
          <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 bg-[#F5F5F3] dark:bg-[#111111]">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0A0A09] border border-border text-[13px] outline-none focus:border-primary"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "All Roles" | UserRole)
              }
              className="px-3 py-2 bg-white dark:bg-[#0A0A09] border border-border text-[13px] outline-none focus:border-primary"
            >
              <option>All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <span className="text-[12px] text-muted-foreground ml-auto">
              {filtered.length} of {users.length} users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#FAFAF8] dark:bg-[#111111] border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
                    Member
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
                    Role
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
                    Articles
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
                    Activity
                  </th>
                  <th className="px-5 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No users match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((user) => {
                  const articleCount = articlesByAuthor[user.name] ?? 0;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#FAFAF8] dark:hover:bg-[#111111] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-[#C41E3A] flex items-center justify-center font-bold text-[12px] text-white shrink-0">
                            {user.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {user.name}
                            </p>
                            <p className="text-[12px] text-muted-foreground truncate">
                              {user.email}
                            </p>
                            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider mt-0.5">
                              ID {user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`${ROLE_STYLES[user.role]} px-2 py-1 text-[10px] font-bold uppercase tracking-widest inline-block`}
                        >
                          {user.role}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-2 max-w-[180px] leading-snug">
                          {ROLE_INFO[user.role].description}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-serif text-[22px] font-bold text-foreground">
                          {articleCount}
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          published
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#008A45] shrink-0" />
                          <span className="text-muted-foreground">{user.lastActive}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            type="button"
                            onClick={() => openEdit(user.id)}
                            className="text-[12px] font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(user.id)}
                            className="text-[12px] font-medium text-muted-foreground hover:text-[#C41E3A] uppercase tracking-wider transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="flex flex-col gap-5">
          <RolePermissionsPanel roleCounts={roleCounts} />
          <TeamBreakdownPanel roleCounts={roleCounts} total={users.length} />

          <div className="border border-border border-l-[3px] border-l-primary bg-[#FAFAF8] dark:bg-[#111111] px-5 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
              Editorial note
            </p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Article counts in the table match each story&apos;s{" "}
              <span className="font-medium text-foreground">Author</span> field.
              Use the same byline spelling across drafts for accurate totals.
            </p>
          </div>
        </aside>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white dark:bg-[#1A1A18] border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-serif text-[20px] font-bold">
                {modal === "add" ? "Add Admin" : "Edit Admin"}
              </h3>
              {modal === "edit" && form.name.trim() ? (
                <Link
                  href="/admin/staff"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground shrink-0"
                >
                  Edit staff profile
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground -mt-2">
              Account
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                Full name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
                placeholder="Jane Doe"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="jane@palawandaily.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as UserRole })
                }
                className="input"
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                {ROLE_INFO[form.role].description}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-5 py-2 text-[12px] font-bold uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-[12px] font-bold uppercase tracking-widest bg-[#C41E3A] text-white hover:bg-[#A01830] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-white dark:bg-[#1A1A18] border border-border w-full max-w-sm p-8 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-[20px] font-bold">Remove user?</h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              This user will lose access to the CMS. You cannot remove the last
              Super Admin.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-5 py-2 text-[12px] font-bold uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 text-[12px] font-bold uppercase tracking-widest bg-[#C41E3A] text-white hover:bg-[#A01830] transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
