"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { adminToast } from "@/lib/admin-toast";

type MfaStatus = {
  enrolled: boolean;
  canEnroll: boolean;
  friendlyName?: string | null;
  factorId?: string | null;
  factorCreatedAt?: string | null;
  factorUpdatedAt?: string | null;
  issuer?: string | null;
  currentLevel?: string | null;
  nextLevel?: string | null;
  sessionAtAal2?: boolean;
  needsChallenge?: boolean;
};

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type CaptchaStatus = {
  required: boolean;
  passed: boolean;
};

const RECOMMENDED_APPS = [
  "Google Authenticator",
  "Microsoft Authenticator",
  "Authy",
  "1Password",
];

const SIGN_IN_STEPS = [
  "Complete the login security check (when enabled).",
  "Enter your admin email and password.",
  "Open your authenticator app and enter the 6-digit code.",
];

function formatFactorDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncateId(id: string | null | undefined) {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function SecuritySidebar() {
  return (
    <aside className="flex flex-col gap-5">
      <div className="bg-white dark:bg-[#1A1A18] border border-border overflow-hidden">
        <div className="px-5 py-5 border-b border-border bg-[#FAFAF8] dark:bg-[#111111]">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
            Admin sign-in
          </p>
          <h2 className="font-serif text-[22px] font-bold text-foreground leading-tight">
            How it works
          </h2>
        </div>
        <ol className="px-5 py-4 space-y-3">
          {SIGN_IN_STEPS.map((step, i) => (
            <li key={step} className="flex gap-3 text-[13px] text-muted-foreground leading-snug">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[11px] font-bold text-foreground">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-white dark:bg-[#1A1A18] border border-border p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-3">
          Compatible apps
        </p>
        <ul className="space-y-2">
          {RECOMMENDED_APPS.map((app) => (
            <li
              key={app}
              className="flex items-center gap-2.5 text-[13px] text-foreground/90"
            >
              <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
              {app}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white dark:bg-[#1A1A18] border border-border p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground mb-3">
          Best practices
        </p>
        <ul className="space-y-2.5">
          {[
            "Store backup codes if your app provides them.",
            "Do not share your authenticator QR code or secret key.",
            "Use a separate device from your daily browsing when possible.",
            "Sign out on shared computers after each session.",
          ].map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-2 text-[12px] text-muted-foreground leading-snug"
            >
              <Check className="h-4 w-4 text-[#008A45] shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-[#F5F5F3] dark:bg-[#111111] border border-border p-5">
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Super Admins can see which team members have authenticators enabled on{" "}
          <Link
            href="/admin/users"
            className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            Admin Users
          </Link>
          .
        </p>
      </div>
    </aside>
  );
}

export default function AdminSecurity() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupRequired = searchParams.get("required") === "1";
  const autoEnrollStarted = useRef(false);

  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [captchaStatus, setCaptchaStatus] = useState<CaptchaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [mfaRes, sessionRes, captchaRes] = await Promise.all([
        fetch("/api/admin/mfa/status", { credentials: "include" }),
        fetch("/api/admin/session", { credentials: "include" }),
        fetch("/api/admin/captcha/status", { credentials: "include" }),
      ]);

      if (!mfaRes.ok) throw new Error("Failed to load security settings");
      setStatus((await mfaRes.json()) as MfaStatus);

      if (sessionRes.ok) {
        const sessionData = (await sessionRes.json()) as { user?: SessionUser };
        setSessionUser(sessionData.user ?? null);
      }

      if (captchaRes.ok) {
        setCaptchaStatus((await captchaRes.json()) as CaptchaStatus);
      }
    } catch {
      setStatus({ enrolled: false, canEnroll: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (
      !setupRequired ||
      loading ||
      enrolling ||
      status?.enrolled ||
      !status?.canEnroll ||
      autoEnrollStarted.current
    ) {
      return;
    }
    autoEnrollStarted.current = true;
    void startEnroll();
  }, [setupRequired, loading, enrolling, status?.enrolled, status?.canEnroll]);

  async function startEnroll() {
    setEnrolling(true);
    setCode("");
    try {
      const res = await fetch("/api/admin/mfa/enroll", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as {
        error?: string;
        factorId?: string;
        challengeId?: string;
        qrCode?: string;
        secret?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not start setup");
      setFactorId(data.factorId ?? "");
      setChallengeId(data.challengeId ?? "");
      setQrCode(data.qrCode ?? null);
      setSecret(data.secret ?? null);
    } catch (err) {
      adminToast.error(
        "Setup failed",
        err instanceof Error ? err.message : "Try again later.",
      );
      setEnrolling(false);
    }
  }

  async function confirmEnroll() {
    if (code.length !== 6) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/mfa/verify-enroll", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, factorId, challengeId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      adminToast.success(
        "Authenticator enabled",
        setupRequired
          ? "You can use the admin dashboard now."
          : "You will need a code from your app the next time you sign in.",
      );
      setEnrolling(false);
      setQrCode(null);
      setSecret(null);
      setCode("");
      if (setupRequired) {
        router.replace("/admin");
        router.refresh();
        return;
      }
      await loadStatus();
    } catch (err) {
      adminToast.error(
        "Could not verify",
        err instanceof Error ? err.message : "Check the code and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const enrolledLabel = status?.enrolled ? "Active" : setupRequired ? "Required" : "Not set up";
  const sessionLabel = status?.sessionAtAal2
    ? "Verified"
    : status?.needsChallenge
      ? "Code needed"
      : "Password only";
  const captchaLabel =
    captchaStatus?.required === false
      ? "Off"
      : captchaStatus?.passed
        ? "Passed"
        : "At login";

  const enrolledSince = formatFactorDate(status?.factorCreatedAt);
  const lastFactorUpdate = formatFactorDate(status?.factorUpdatedAt);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-start gap-3 min-w-0">
          <ShieldCheck className="h-8 w-8 text-primary shrink-0 mt-1" strokeWidth={1.5} />
          <div className="min-w-0">
            <h1 className="font-serif text-[32px] font-bold text-foreground">Security</h1>
            <p className="text-[14px] text-muted-foreground mt-1 max-w-2xl">
              {setupRequired
                ? "Every admin must enroll an authenticator before using the CMS. Complete setup below to continue."
                : "Two-factor authentication protects your account. Password plus a time-based code from your phone is required for every admin sign-in."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadStatus()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-[12px] font-bold uppercase tracking-widest border border-border hover:bg-muted transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {setupRequired && !status?.enrolled ? (
        <Alert className="border-[#C41E3A]/30 bg-[#C41E3A]/5">
          <AlertDescription className="text-[14px]">
            <strong className="text-foreground">Setup required.</strong> You cannot open
            other admin pages until authenticator enrollment is complete. Use Google
            Authenticator, Microsoft Authenticator, Authy, or another TOTP app.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          label="Authenticator"
          value={loading ? "…" : enrolledLabel}
          accent={status?.enrolled ? "success" : setupRequired ? "primary" : "warning"}
          hint={
            status?.enrolled
              ? status.friendlyName ?? "TOTP enrolled on this account"
              : "Required for all admin accounts"
          }
        />
        <AdminStatCard
          label="This session"
          value={loading ? "…" : sessionLabel}
          accent={status?.sessionAtAal2 ? "success" : "default"}
          hint={
            status?.sessionAtAal2
              ? "Elevated access (AAL2) — MFA verified this session"
              : status?.needsChallenge
                ? "Sign out and sign in again to verify with your app"
                : "Password sign-in only until MFA is used"
          }
        />
        <AdminStatCard
          label="Login protection"
          value={loading ? "…" : captchaLabel}
          hint={
            captchaStatus?.required
              ? "Cloudflare Turnstile before the login form"
              : "Turnstile not configured in this environment"
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          {sessionUser ? (
            <div className="bg-white dark:bg-[#1A1A18] border border-border px-5 py-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#C41E3A] flex items-center justify-center font-bold text-[12px] text-white shrink-0">
                  {sessionUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{sessionUser.name}</p>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {sessionUser.email}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-muted text-muted-foreground">
                {sessionUser.role}
              </span>
              <span className="text-[11px] text-muted-foreground ml-auto">
                Account ID {sessionUser.id}
              </span>
            </div>
          ) : null}

          {loading ? (
            <div className="bg-white dark:bg-[#1A1A18] border border-border p-8 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[14px]">Loading security settings…</span>
            </div>
          ) : status?.enrolled ? (
            <div className="bg-white dark:bg-[#1A1A18] border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-[#008A45]/5 dark:bg-[#008A45]/10 flex flex-wrap items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#008A45]/15 shrink-0">
                  <ShieldCheck className="h-6 w-6 text-[#008A45]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#008A45]">
                    Authenticator active
                  </p>
                  <p className="mt-1 text-[15px] text-foreground leading-relaxed">
                    Sign-in requires your password and a 6-digit code from your
                    authenticator app
                    {status.friendlyName ? (
                      <>
                        {" "}
                        (<span className="font-medium">{status.friendlyName}</span>)
                      </>
                    ) : null}
                    .
                  </p>
                </div>
              </div>

              <dl className="divide-y divide-border">
                {(
                  [
                    {
                      label: "App label in authenticator",
                      value: status.friendlyName ?? "Palawan Daily News Admin",
                      icon: Smartphone,
                    },
                    {
                      label: "Issuer (QR code)",
                      value: status.issuer ?? "Palawan Daily News",
                      icon: KeyRound,
                    },
                    {
                      label: "Enrolled",
                      value: enrolledSince ?? "—",
                      icon: Lock,
                    },
                    {
                      label: "Last updated",
                      value: lastFactorUpdate ?? enrolledSince ?? "—",
                      icon: RefreshCw,
                    },
                    {
                      label: "Factor ID",
                      value: truncateId(status.factorId),
                      icon: ShieldCheck,
                      mono: true,
                    },
                    {
                      label: "Session assurance",
                      value: status.sessionAtAal2
                        ? "AAL2 — MFA verified this session"
                        : status.needsChallenge
                          ? "Sign in again to verify with your app"
                          : `AAL1 — password only (${status.currentLevel ?? "unknown"})`,
                      icon: LogIn,
                    },
                  ] as const
                ).map((row) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={row.label}
                      className="px-6 py-4 flex flex-wrap items-start gap-3 sm:gap-4"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {row.label}
                        </dt>
                        <dd
                          className={
                            "mono" in row && row.mono
                              ? "mt-1 font-mono text-[13px] text-foreground"
                              : "mt-1 text-[14px] text-foreground leading-relaxed"
                          }
                        >
                          {row.value}
                        </dd>
                      </div>
                    </div>
                  );
                })}
              </dl>

              <div className="px-6 py-5 border-t border-border bg-[#FAFAF8] dark:bg-[#111111]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Change or replace your device
                </p>
                <ol className="space-y-2 text-[13px] text-muted-foreground leading-relaxed list-decimal list-inside">
                  <li>
                    In Supabase Dashboard → Authentication → Users → your user → MFA,
                    remove the existing factor.
                  </li>
                  <li>Return here and use setup again (contact a Super Admin if locked out).</li>
                  <li>Scan the new QR code with your authenticator app on the new phone.</li>
                </ol>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-4 text-[12px] font-medium text-foreground hover:text-primary transition-colors"
                >
                  Open Supabase Dashboard
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ) : enrolling ? (
            <div className="bg-white dark:bg-[#1A1A18] border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-[#FAFAF8] dark:bg-[#111111]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Step 1 of 2
                </p>
                <h2 className="font-serif text-[22px] font-bold text-foreground mt-1">
                  Scan QR code
                </h2>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  Open your authenticator app and add a new account. The entry will appear
                  as <strong className="text-foreground">{status?.issuer ?? "Palawan Daily News"}</strong>.
                </p>
              </div>

              <div className="px-6 py-6 space-y-6">
                {qrCode ? (
                  <div
                    className="inline-block rounded-sm border border-border bg-white p-4 [&_svg]:max-w-[220px]"
                    dangerouslySetInnerHTML={{ __html: qrCode }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating QR code…
                  </p>
                )}
                {secret ? (
                  <div className="rounded-sm border border-border bg-[#FAFAF8] dark:bg-[#111111] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Manual entry key
                    </p>
                    <p className="font-mono text-[13px] text-foreground break-all">{secret}</p>
                  </div>
                ) : null}

                <div className="border-t border-border pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Step 2 of 2
                  </p>
                  <p className="mt-2 text-[14px] font-medium text-foreground">
                    Enter the 6-digit code to confirm
                  </p>
                  <div className="mt-4">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="bg-[#C41E3A] hover:bg-[#A01830] text-white"
                    disabled={saving || code.length !== 6}
                    onClick={() => void confirmEnroll()}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      "Enable authenticator"
                    )}
                  </Button>
                  {!setupRequired ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEnrolling(false);
                        setQrCode(null);
                        setSecret(null);
                        setCode("");
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1A18] border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#B45309]/10 shrink-0">
                  <ShieldAlert className="h-6 w-6 text-[#B45309]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#B45309]">
                    Authenticator not configured
                  </p>
                  <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed max-w-xl">
                    {setupRequired
                      ? "Your organization requires an authenticator for every admin. Complete setup to unlock the dashboard."
                      : "Add a second step to your sign-in. After setup, each login will ask for your password and a rotating 6-digit code."}
                  </p>
                </div>
              </div>

              <div className="px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Before you start
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "Install an authenticator app on your phone.",
                    "Keep this page open until you finish scanning and verifying.",
                    "You will need your phone every time you sign in to admin.",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-[13px] text-muted-foreground"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-bold">
                        ✓
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  className="bg-[#C41E3A] hover:bg-[#A01830] text-white"
                  onClick={() => void startEnroll()}
                  disabled={!status?.canEnroll}
                >
                  Set up authenticator app
                </Button>
              </div>
            </div>
          )}
        </div>

        <SecuritySidebar />
      </div>
    </div>
  );
}
