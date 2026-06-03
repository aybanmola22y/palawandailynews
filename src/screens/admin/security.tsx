"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { adminToast } from "@/lib/admin-toast";

type MfaStatus = {
  enrolled: boolean;
  canEnroll: boolean;
  friendlyName?: string | null;
};

export default function AdminSecurity() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupRequired = searchParams.get("required") === "1";
  const autoEnrollStarted = useRef(false);

  const [status, setStatus] = useState<MfaStatus | null>(null);
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
      const res = await fetch("/api/admin/mfa/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load security settings");
      setStatus((await res.json()) as MfaStatus);
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

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <header className="border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <div>
            <h1 className="font-serif text-[32px] font-bold text-foreground">
              Security
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1">
              {setupRequired
                ? "An authenticator app is required for every admin account before using the CMS."
                : "Add an authenticator app for a second step when signing in to the admin."}
            </p>
          </div>
        </div>
      </header>

      {setupRequired && !status?.enrolled ? (
        <Alert>
          <AlertDescription>
            Set up Google Authenticator, Microsoft Authenticator, Authy, or another
            TOTP app. You cannot open other admin pages until this is complete.
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </p>
      ) : status?.enrolled ? (
        <div className="border border-border bg-card p-6">
          <p className="text-[13px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
            Authenticator active
          </p>
          <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
            Sign-in always requires your password and a 6-digit code from your
            authenticator app
            {status.friendlyName ? ` (${status.friendlyName})` : ""}. To change devices,
            remove the factor in Supabase Dashboard → Authentication → Users → your
            user → MFA, then set up again here.
          </p>
        </div>
      ) : enrolling ? (
        <div className="border border-border bg-card p-6 space-y-6">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-widest">
              Scan QR code
            </p>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Use Google Authenticator, Microsoft Authenticator, Authy, or 1Password.
            </p>
          </div>
          {qrCode ? (
            <div
              className="inline-block rounded-sm border border-border bg-white p-4 [&_svg]:max-w-[220px]"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
          ) : null}
          {secret ? (
            <p className="text-[12px] text-muted-foreground break-all">
              Manual key: <span className="font-mono text-foreground">{secret}</span>
            </p>
          ) : null}
          <div className="space-y-3">
            <p className="text-[13px] font-medium">Enter the 6-digit code to confirm</p>
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
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
      ) : (
        <div className="border border-border bg-card p-6">
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            {setupRequired
              ? "Your organization requires an authenticator app for all admin users. Complete setup below to continue."
              : "Protect your admin account with time-based codes from an authenticator app. After setup, each sign-in will ask for your password and a 6-digit code."}
          </p>
          <Button
            type="button"
            className="mt-6 bg-[#C41E3A] hover:bg-[#A01830] text-white"
            onClick={() => void startEnroll()}
            disabled={!status?.canEnroll}
          >
            Set up authenticator app
          </Button>
        </div>
      )}
    </div>
  );
}
