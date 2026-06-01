import Link from "next/link";
import { SidebarPanel } from "@/components/editorial/SidebarPanel";

export function LatestSidebar() {
  return (
    <>
      <SidebarPanel title="Sections">
        <nav className="flex flex-col gap-1">
          {[
            { label: "Environment", href: "/latest" },
            { label: "Business", href: "/latest" },
            { label: "Opinion", href: "/opinion" },
            { label: "Legal notices", href: "/legal" },
            { label: "Lifestyle", href: "/lifestyle" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="py-2 text-sm font-medium border-b border-border hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SidebarPanel>

      <SidebarPanel title="Opinion">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Essays and commentary from Palawan&apos;s columnists.
        </p>
        <Link
          href="/opinion"
          className="text-[11px] uppercase tracking-widest font-semibold text-primary hover:underline"
        >
          Read opinion →
        </Link>
      </SidebarPanel>
    </>
  );
}
