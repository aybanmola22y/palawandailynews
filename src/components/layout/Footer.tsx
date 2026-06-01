import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="bg-foreground text-background mt-auto"
      data-testid="footer"
    >
      <div className="editorial-container pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="font-serif text-2xl tracking-wide font-bold mb-4">
              Palawan Daily
            </div>
            <p className="text-background/65 text-sm leading-relaxed max-w-xs">
              Authoritative, independent journalism for Palawan and the
              Philippines — delivered with clarity and integrity.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-background/45 mb-4">
              Sections
            </h4>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link
                href="/latest"
                className="text-background/70 hover:text-background"
              >
                Latest News
              </Link>
              <Link
                href="/opinion"
                className="text-background/70 hover:text-background"
              >
                Opinion
              </Link>
              <Link
                href="/lifestyle"
                className="text-background/70 hover:text-background"
              >
                Lifestyle
              </Link>
              <Link
                href="/legal"
                className="text-background/70 hover:text-background"
              >
                Legal Notices
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-background/45 mb-4">
              Contact
            </h4>
            <div className="flex flex-col gap-2 text-sm text-background/70">
              <p>Puerto Princesa City</p>
              <p>Palawan, Philippines</p>
              <a
                href="mailto:newsroom@palawandaily.com"
                className="hover:text-background mt-1"
              >
                newsroom@palawandaily.com
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-background/45 mb-4">
              Corporate
            </h4>
            <div className="flex flex-col gap-2.5 text-sm">
              <Link
                href="/about"
                className="text-background/70 hover:text-background"
              >
                About Us
              </Link>
              <Link
                href="/advertise"
                className="text-background/70 hover:text-background"
              >
                Advertise
              </Link>
              <Link
                href="/admin/login"
                className="text-background/70 hover:text-background"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="editorial-container py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-background/45">
          <p>© {new Date().getFullYear()} Palawan Daily News. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-background/70 cursor-pointer transition-colors">
              Terms of Service
            </span>
            <span className="hover:text-background/70 cursor-pointer transition-colors">
              Privacy Policy
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
