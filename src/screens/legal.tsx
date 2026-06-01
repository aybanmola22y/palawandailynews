import { legalNotices } from "@/data/legal";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/editorial/PageHeader";

export default function Legal() {
  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="editorial-container">
        <PageHeader
          title="Legal & Public Notices"
          description="Official announcements, biddings, regulatory notices, and public hearings for the Province of Palawan."
        />

        <div className="editorial-card overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 border-b border-border bg-secondary/40">
            <h2 className="text-sm font-semibold uppercase tracking-widest">
              Document registry
            </h2>
            <select className="bg-card border border-border text-sm px-3 py-2 rounded-sm outline-none focus:border-primary w-full sm:w-auto">
              <option>All Agencies</option>
              <option>Provincial Gov.</option>
              <option>DENR</option>
            </select>
          </div>

          <div className="flex flex-col divide-y divide-border">
            {legalNotices.map((notice) => (
              <div
                key={notice.id}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 md:p-6 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    <span className="font-mono">{notice.id}</span>
                    <span>·</span>
                    <span>{notice.date}</span>
                    <span>·</span>
                    <span className="font-semibold text-foreground">
                      {notice.agency}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg md:text-xl leading-snug pr-4">
                    {notice.title}
                  </h3>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mt-2">
                    Status: {notice.status}
                  </p>
                </div>

                <button className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground hover:text-primary transition-colors shrink-0 border border-border px-4 py-2.5 rounded-sm hover:border-primary">
                  <Download className="w-4 h-4" />
                  View PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
