import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export type AdminAuthRateLimitBucket =
  | "login-ip"
  | "login-email"
  | "mfa-ip"
  | "mfa-enroll"
  | "setup-password-ip"
  | "captcha-ip";

type BucketConfig = {
  windowMs: number;
  maxAttempts: number;
  lockoutMs: number;
};

const BUCKETS: Record<AdminAuthRateLimitBucket, BucketConfig> = {
  "login-ip": { windowMs: 15 * 60_000, maxAttempts: 15, lockoutMs: 30 * 60_000 },
  "login-email": { windowMs: 15 * 60_000, maxAttempts: 8, lockoutMs: 30 * 60_000 },
  "mfa-ip": { windowMs: 15 * 60_000, maxAttempts: 12, lockoutMs: 20 * 60_000 },
  "mfa-enroll": { windowMs: 15 * 60_000, maxAttempts: 10, lockoutMs: 20 * 60_000 },
  "setup-password-ip": {
    windowMs: 60 * 60_000,
    maxAttempts: 5,
    lockoutMs: 60 * 60_000,
  },
  "captcha-ip": { windowMs: 15 * 60_000, maxAttempts: 20, lockoutMs: 15 * 60_000 },
};

type MemoryEntry = {
  attempts: number;
  windowStart: number;
  lockedUntil: number | null;
};

const memoryStore = new Map<string, MemoryEntry>();
let supabaseTableReady: boolean | null = null;

export function getRequestClientIp(request: NextRequest | Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

function buildKey(bucket: AdminAuthRateLimitBucket, suffix: string): string {
  return `${bucket}:${suffix}`;
}

function nowMs() {
  return Date.now();
}

type RateState = {
  attempts: number;
  windowStart: number;
  lockedUntil: number | null;
};

function evaluateState(
  state: RateState,
  config: BucketConfig,
  increment: boolean,
): { allowed: boolean; retryAfterSec: number; state: RateState } {
  const now = nowMs();

  if (state.lockedUntil && state.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((state.lockedUntil - now) / 1000),
      state,
    };
  }

  let { attempts, windowStart, lockedUntil } = state;
  if (now - windowStart > config.windowMs) {
    attempts = 0;
    windowStart = now;
    lockedUntil = null;
  }

  if (increment) {
    attempts += 1;
    if (attempts >= config.maxAttempts) {
      lockedUntil = now + config.lockoutMs;
      return {
        allowed: false,
        retryAfterSec: Math.ceil(config.lockoutMs / 1000),
        state: { attempts, windowStart, lockedUntil },
      };
    }
  } else if (attempts >= config.maxAttempts) {
    lockedUntil = lockedUntil ?? now + config.lockoutMs;
    return {
      allowed: false,
      retryAfterSec: Math.ceil(
        ((lockedUntil ?? now + config.lockoutMs) - now) / 1000,
      ),
      state: { attempts, windowStart, lockedUntil },
    };
  }

  return {
    allowed: true,
    retryAfterSec: 0,
    state: { attempts, windowStart, lockedUntil },
  };
}

function memoryGet(key: string): RateState {
  const row = memoryStore.get(key);
  if (!row) {
    return { attempts: 0, windowStart: nowMs(), lockedUntil: null };
  }
  return {
    attempts: row.attempts,
    windowStart: row.windowStart,
    lockedUntil: row.lockedUntil,
  };
}

function memorySet(key: string, state: RateState) {
  memoryStore.set(key, {
    attempts: state.attempts,
    windowStart: state.windowStart,
    lockedUntil: state.lockedUntil,
  });
}

function memoryDelete(key: string) {
  memoryStore.delete(key);
}

async function supabaseGet(key: string): Promise<RateState | null> {
  const service = getSupabaseServiceClient();
  if (!service) return null;

  const { data, error } = await service
    .from("admin_auth_rate_limits")
    .select("attempts, window_start, locked_until")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      supabaseTableReady = false;
      return null;
    }
    if (supabaseTableReady === null) supabaseTableReady = false;
    return null;
  }

  supabaseTableReady = true;
  if (!data) {
    return { attempts: 0, windowStart: nowMs(), lockedUntil: null };
  }

  return {
    attempts: data.attempts ?? 0,
    windowStart: Date.parse(data.window_start) || nowMs(),
    lockedUntil: data.locked_until ? Date.parse(data.locked_until) : null,
  };
}

async function supabaseSet(key: string, state: RateState): Promise<void> {
  const service = getSupabaseServiceClient();
  if (!service || supabaseTableReady === false) return;

  const { error } = await service.from("admin_auth_rate_limits").upsert(
    {
      key,
      attempts: state.attempts,
      window_start: new Date(state.windowStart).toISOString(),
      locked_until: state.lockedUntil
        ? new Date(state.lockedUntil).toISOString()
        : null,
    },
    { onConflict: "key" },
  );

  if (error?.code === "42P01") supabaseTableReady = false;
}

async function supabaseDelete(key: string): Promise<void> {
  const service = getSupabaseServiceClient();
  if (!service || supabaseTableReady === false) return;
  await service.from("admin_auth_rate_limits").delete().eq("key", key);
}

async function loadState(key: string): Promise<RateState> {
  const fromDb = await supabaseGet(key);
  if (fromDb) return fromDb;
  return memoryGet(key);
}

async function saveState(key: string, state: RateState): Promise<void> {
  await supabaseSet(key, state);
  memorySet(key, state);
}

async function clearState(key: string): Promise<void> {
  await supabaseDelete(key);
  memoryDelete(key);
}

async function runCheck(
  key: string,
  bucket: AdminAuthRateLimitBucket,
  increment: boolean,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const config = BUCKETS[bucket];
  const current = await loadState(key);
  const result = evaluateState(current, config, increment);
  await saveState(key, result.state);
  return { allowed: result.allowed, retryAfterSec: result.retryAfterSec };
}

export async function checkAdminAuthRateLimit(
  request: NextRequest | Request,
  bucket: AdminAuthRateLimitBucket,
  suffix?: string,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const part =
    suffix?.trim().toLowerCase() ||
    (bucket.includes("ip") ? getRequestClientIp(request) : "unknown");
  const key = buildKey(bucket, part);
  return runCheck(key, bucket, false);
}

export async function recordAdminAuthFailure(
  request: NextRequest | Request,
  bucket: AdminAuthRateLimitBucket,
  suffix?: string,
): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const part =
    suffix?.trim().toLowerCase() ||
    (bucket.includes("ip") ? getRequestClientIp(request) : "unknown");
  const key = buildKey(bucket, part);
  return runCheck(key, bucket, true);
}

export async function clearAdminAuthRateLimits(
  request: NextRequest | Request,
  email?: string,
): Promise<void> {
  const ip = getRequestClientIp(request);
  const keys = [
    buildKey("login-ip", ip),
    buildKey("mfa-ip", ip),
    buildKey("mfa-enroll", ip),
    buildKey("setup-password-ip", ip),
  ];
  if (email?.trim()) {
    keys.push(buildKey("login-email", email.trim().toLowerCase()));
  }
  await Promise.all(keys.map((key) => clearState(key)));
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  const retry = Math.max(1, retryAfterSec);
  return NextResponse.json(
    {
      error: `Too many attempts. Please wait ${retry} seconds before trying again.`,
      code: "RATE_LIMITED",
    },
    {
      status: 429,
      headers: { "Retry-After": String(retry) },
    },
  );
}

/** Returns a 429 response when limited, otherwise null. */
export async function enforceAdminAuthRateLimit(
  request: NextRequest | Request,
  buckets: AdminAuthRateLimitBucket[],
  email?: string,
): Promise<NextResponse | null> {
  for (const bucket of buckets) {
    const suffix = bucket === "login-email" ? email : undefined;
    const { allowed, retryAfterSec } = await checkAdminAuthRateLimit(
      request,
      bucket,
      suffix,
    );
    if (!allowed) return rateLimitResponse(retryAfterSec);
  }
  return null;
}

/** After a failed login/MFA attempt; returns 429 if now locked out. */
export async function recordAdminLoginFailures(
  request: NextRequest | Request,
  email: string,
): Promise<NextResponse | null> {
  const ip = await recordAdminAuthFailure(request, "login-ip");
  if (!ip.allowed) return rateLimitResponse(ip.retryAfterSec);

  if (email) {
    const byEmail = await recordAdminAuthFailure(
      request,
      "login-email",
      email,
    );
    if (!byEmail.allowed) return rateLimitResponse(byEmail.retryAfterSec);
  }
  return null;
}

export async function recordAdminMfaFailure(
  request: NextRequest | Request,
): Promise<NextResponse | null> {
  const result = await recordAdminAuthFailure(request, "mfa-ip");
  if (!result.allowed) return rateLimitResponse(result.retryAfterSec);
  return null;
}
