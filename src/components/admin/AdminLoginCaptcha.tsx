"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

declare global {
  interface Window {
    turnstileOnLoad?: () => void;
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: Record<string, unknown>,
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=turnstileOnLoad";

type Props = {
  siteKey: string;
  onVerified: () => void;
};

export function AdminLoginCaptcha({ siteKey, onVerified }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const verifyToken = useCallback(
    async (token: string) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/captcha/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "Verification failed. Please try again.");
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
          return;
        }
        onVerified();
      } catch {
        setError("Network error. Please try again.");
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [onVerified],
  );

  useEffect(() => {
    function removeWidget() {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    }

    function renderWidget() {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (token: string) => {
          void verifyToken(token);
        },
        "error-callback": () => {
          setError(
            "Captcha could not load. In Cloudflare Turnstile, add hostname localhost (and your live domain), then refresh.",
          );
        },
        "expired-callback": () => {
          setError("Captcha expired. Please verify again.");
          if (widgetIdRef.current && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
          }
        },
      });
    }

    window.turnstileOnLoad = renderWidget;

    if (window.turnstile) {
      renderWidget();
      return removeWidget;
    }

    const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", renderWidget, { once: true });
      return () => {
        existing.removeEventListener("load", renderWidget);
        removeWidget();
        delete window.turnstileOnLoad;
      };
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SRC;
    script.onerror = () =>
      setError("Could not load the security check. Refresh the page.");
    document.head.appendChild(script);

    return () => {
      removeWidget();
      delete window.turnstileOnLoad;
    };
  }, [siteKey, verifyToken]);

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-center text-muted-foreground">
        <Shield className="h-10 w-10" strokeWidth={1.25} />
      </div>

      <div ref={containerRef} className="flex justify-center min-h-[65px]" />

      {submitting ? (
        <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Verifying…
        </p>
      ) : (
        <p className="text-center text-[12px] text-muted-foreground">
          Complete the check above to continue to staff sign-in.
        </p>
      )}
    </div>
  );
}
