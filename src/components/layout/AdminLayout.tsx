"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Users,
  IdCard,
  LogOut,
} from "lucide-react";
import { useAdminAuth } from "@/store/admin-auth-context";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuth();

  async function handleSignOut() {
    await logout();
    router.replace("/admin/login");
    router.refresh();
  }

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Articles", path: "/admin/articles", icon: FileText },
    { label: "Media Library", path: "/admin/media", icon: ImageIcon },
    { label: "Advertisements", path: "/admin/ads", icon: Megaphone },
    { label: "Admin Users", path: "/admin/users", icon: Users },
    { label: "Staff", path: "/admin/staff", icon: IdCard },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F3] dark:bg-[#0A0A09] flex font-sans text-foreground">
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#111111] text-white flex flex-col fixed h-full z-10 border-r border-[#2A2A26]">
        <div className="p-6 border-b border-[#2A2A26]">
          <Link href="/" className="font-serif font-bold text-[16px] tracking-tight text-white block hover:text-[#AAAAAA] transition-colors">
            PalawanDailyNews
          </Link>
          <span className="text-[#AAAAAA] text-[11px] uppercase tracking-wider">Admin Dashboard</span>
        </div>
        <nav className="flex-1 py-6 flex flex-col">
          {navItems.map((item) => {
            const active = location === item.path || (item.path === '/admin' && location === '/admin/');
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-6 py-3 text-[13px] font-medium transition-colors border-l-[3px] ${
                  active 
                    ? "border-[#C41E3A] bg-[#1A1A18] text-white" 
                    : "border-transparent text-[#AAAAAA] hover:text-white hover:bg-[#1A1A18]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 border-t border-[#2A2A26]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
              {/* Initials fallback */}
              <div className="w-full h-full flex items-center justify-center bg-[#C41E3A] text-white text-[12px] font-bold">
                {user?.avatar ?? "AD"}
              </div>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[13px] font-bold truncate">
                {user?.name ?? "Admin User"}
              </span>
              <span className="text-[11px] text-[#AAAAAA] truncate">
                {user?.role ?? "Editor"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 text-[13px] font-medium text-[#AAAAAA] hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[240px] p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
