"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useUsers } from "@/store/users-context";
import { useStaff, type StaffProfile } from "@/store/staff-context";
import { useArticles } from "@/store/articles-context";
import { adminToast } from "@/lib/admin-toast";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Search, ExternalLink } from "lucide-react";
import { authorProfilePath } from "@/lib/author-profile";
import { defaultAuthorProfile } from "@/lib/author-profile-defaults";
import { paginateArticles } from "@/lib/site-articles";

type ProfileFormState = {
  name: string;
  profileTitle: string;
  quote: string;
  bio: string;
  badgeLabel: string;
};

function formFromStaff(member: StaffProfile): ProfileFormState {
  const defaults = defaultAuthorProfile(member.name, undefined);
  return {
    name: member.name,
    profileTitle: member.profileTitle ?? defaults.profileTitle,
    quote: member.quote ?? defaults.quote,
    bio: member.bio ?? defaults.bio,
    badgeLabel: member.badgeLabel ?? defaults.badgeLabel,
  };
}

export default function AdminStaff() {
  const { users } = useUsers();
  const { staff, addStaff, updateStaff, deleteStaff } = useStaff();
  const { articles } = useArticles();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const articlesByAuthor = useMemo(() => {
    const map: Record<string, number> = {};
    articles.forEach((a) => {
      if (a.author) map[a.author] = (map[a.author] ?? 0) + 1;
    });
    return map;
  }, [articles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staff.filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.profileTitle.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q),
    );
  }, [staff, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { items: pageStaff, totalPages } = useMemo(
    () => paginateArticles(filtered, page, perPage),
    [filtered, page, perPage],
  );

  const canPrev = page > 1;
  const canNext = page < totalPages;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openEdit(id: string) {
    const member = staff.find((s) => s.id === id);
    if (!member) return;
    setEditingId(id);
    setForm(formFromStaff(member));
    setModal("edit");
  }

  function openAdd() {
    setEditingId(null);
    setForm({
      name: "",
      ...defaultAuthorProfile("", undefined),
    });
    setModal("add");
  }

  function close() {
    setEditingId(null);
    setForm(null);
    setModal(null);
  }

  async function handleSave() {
    if (!form) return;
    if (!form.name.trim()) {
      adminToast.error("Missing name", "Name is required for a staff profile.");
      return;
    }

    try {
      if (modal === "add") {
        await addStaff({
          name: form.name.trim(),
          profileTitle: form.profileTitle,
          quote: form.quote,
          bio: form.bio,
          badgeLabel: form.badgeLabel,
        });
        adminToast.success(
          "Staff added",
          `${form.name} was added to Staff (no admin access).`,
        );
      } else if (modal === "edit" && editingId) {
        await updateStaff(editingId, {
          name: form.name.trim(),
          profileTitle: form.profileTitle,
          quote: form.quote,
          bio: form.bio,
          badgeLabel: form.badgeLabel,
        });
        adminToast.success(
          "Profile updated",
          `${form.name}'s public profile was saved.`,
        );
      }
      close();
    } catch (err) {
      adminToast.error(
        "Could not save staff profile",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const targetId = deleteId;
    const member = staff.find((s) => s.id === targetId);
    // Close dialog immediately on confirm.
    setDeleteId(null);
    try {
      await deleteStaff(targetId);
      adminToast.success(
        "Staff removed",
        member ? `${member.name} was removed.` : "Staff removed.",
      );
    } catch (err) {
      adminToast.error(
        "Could not remove staff",
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif text-[32px] font-bold text-foreground">
            Staff
          </h1>
          <p className="text-[14px] text-muted-foreground max-w-2xl mt-1">
          Manage public author profiles (title, quote, bio) that appear on
          bylines and author pages. Admin access and roles are managed under{" "}
          <Link href="/admin/users" className="font-semibold text-primary hover:underline">
            Admin Users
          </Link>
          .
        </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-[#C41E3A] text-white px-4 py-2 text-[12px] font-bold uppercase tracking-widest hover:bg-[#A01830] transition-colors shrink-0"
        >
          Add Staff
        </button>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Staff profiles" value={staff.length} hint="Public author pages" />
        <AdminStatCard
          label="Active bylines"
          value={Object.keys(articlesByAuthor).length}
          hint="Unique author names in articles"
          accent="success"
        />
        <AdminStatCard
          label="Most prolific"
          value={
            staff
              .map((u) => ({ name: u.name, count: articlesByAuthor[u.name] ?? 0 }))
              .sort((a, b) => b.count - a.count)[0]?.count ?? 0
          }
          hint="Top author article count"
        />
        <AdminStatCard label="Profiles updated" value="Live" hint="Applies immediately" accent="primary" />
      </div>

      <div className="bg-white dark:bg-[#1A1A18] border border-border flex flex-col min-w-0">
        <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 bg-[#F5F5F3] dark:bg-[#111111]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search staff by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0A0A09] border border-border text-[13px] outline-none focus:border-primary"
            />
          </div>
          <span className="text-[12px] text-muted-foreground ml-auto">
            {filtered.length} of {staff.length} staff
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
                  Public title
                </th>
                <th className="px-5 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground">
                  Articles
                </th>
                <th className="px-5 py-3 font-bold uppercase tracking-widest text-[11px] text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No staff match your search.
                  </td>
                </tr>
              )}
              {pageStaff.map((member) => {
                const articleCount = articlesByAuthor[member.name] ?? 0;
                const adminUser = users.find(
                  (u) =>
                    u.name.trim().toLowerCase() === member.name.trim().toLowerCase(),
                );
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-[#FAFAF8] dark:hover:bg-[#111111] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[#C41E3A] flex items-center justify-center font-bold text-[12px] text-white shrink-0">
                          {member.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {member.name}
                          </p>
                          <p className="text-[12px] text-muted-foreground truncate">
                            Updated {new Date(member.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-foreground/90 line-clamp-2 max-w-[420px]">
                        {member.profileTitle}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Admin:{" "}
                        <span className="font-medium text-foreground">
                          {adminUser ? "Yes" : "No"}
                        </span>
                        {adminUser ? (
                          <span className="ml-2 text-[11px] font-medium text-primary">
                            ({adminUser.role})
                          </span>
                        ) : null}
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
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-3 justify-end">
                        <Link
                          href={authorProfilePath(member.name)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                        >
                          View
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(member.id)}
                          className="text-[12px] font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(member.id)}
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

        <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3 bg-white dark:bg-[#1A1A18]">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Page <span className="text-foreground font-semibold">{page}</span> of{" "}
            <span className="text-foreground font-semibold">{totalPages}</span>
            <span className="text-muted-foreground"> · {perPage} per page</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] border border-border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] border border-border rounded-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {form && modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={close}
        >
          <div
            className="bg-white dark:bg-[#1A1A18] border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-serif text-[20px] font-bold">
                {modal === "add" ? "Add staff profile" : "Edit public profile"}
              </h3>
              {modal === "edit" && form.name.trim() ? (
                <Link
                  href={authorProfilePath(form.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground shrink-0"
                >
                  View author page
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground -mt-2">
              Public author page
            </p>

            <div className="flex flex-col gap-4">
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
                  Professional title
                </label>
                <input
                  value={form.profileTitle}
                  onChange={(e) =>
                    setForm({ ...form, profileTitle: e.target.value })
                  }
                  className="input"
                  placeholder="Staff Reporter & Investigative Journalist"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Pull quote
                </label>
                <textarea
                  value={form.quote}
                  onChange={(e) => setForm({ ...form, quote: e.target.value })}
                  className="input min-h-[72px] resize-y"
                  placeholder="Short italic quote on the author page"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Biography
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="input min-h-[120px] resize-y"
                  placeholder="Full bio paragraph"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  Avatar label
                </label>
                <input
                  value={form.badgeLabel}
                  onChange={(e) =>
                    setForm({ ...form, badgeLabel: e.target.value })
                  }
                  className="input max-w-[240px]"
                  placeholder="Palawan"
                />
                <p className="text-[11px] text-muted-foreground">
                  Small caps text under initials on the profile hero.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={close}
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
            <h3 className="font-serif text-[20px] font-bold">Remove staff?</h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              This only removes the public staff profile. It does not change
              admin access.
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

