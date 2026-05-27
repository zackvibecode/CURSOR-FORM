"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Mail } from "lucide-react";

const EMAIL_COOLDOWN_SECONDS = 60;
const EMAIL_COOLDOWN_STORAGE_KEY = "zaqone-auth-email-cooldown-until";

function isEmailRateLimitError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("rate limit") ||
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("email rate limit exceeded")
  );
}

function getRemainingCooldownSeconds() {
  if (typeof window === "undefined") return 0;

  const stored = sessionStorage.getItem(EMAIL_COOLDOWN_STORAGE_KEY);
  if (!stored) return 0;

  const remainingMs = Number(stored) - Date.now();
  if (Number.isNaN(remainingMs) || remainingMs <= 0) {
    sessionStorage.removeItem(EMAIL_COOLDOWN_STORAGE_KEY);
    return 0;
  }

  return Math.ceil(remainingMs / 1000);
}

function startEmailCooldown() {
  const until = Date.now() + EMAIL_COOLDOWN_SECONDS * 1000;
  sessionStorage.setItem(EMAIL_COOLDOWN_STORAGE_KEY, String(until));
  return EMAIL_COOLDOWN_SECONDS;
}

function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const template = searchParams.get("template");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [error, setError] = useState(
    searchParams.get("error") === "auth"
      ? "Login link expired or invalid. Please request a new one."
      : ""
  );
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const initial = getRemainingCooldownSeconds();
    if (initial > 0) {
      setCooldownSeconds(initial);
    }

    const timer = window.setInterval(() => {
      const remaining = getRemainingCooldownSeconds();
      setCooldownSeconds(remaining);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const buildRedirectUrl = () => {
    const redirectTo = new URL("/auth/confirm", window.location.origin);
    redirectTo.searchParams.set("next", redirect);
    if (template) redirectTo.searchParams.set("template", template);
    return redirectTo.toString();
  };

  const buildOAuthRedirectUrl = () => {
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", redirect);
    if (template) redirectTo.searchParams.set("template", template);
    return redirectTo.toString();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (cooldownSeconds > 0) {
      setError(
        `Too many login emails. Please wait ${cooldownSeconds} second${
          cooldownSeconds === 1 ? "" : "s"
        } before trying again.`
      );
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: buildRedirectUrl(),
      },
    });

    if (authError) {
      if (isEmailRateLimitError(authError.message)) {
        const remaining = startEmailCooldown();
        setCooldownSeconds(remaining);
        setError(
          `Email rate limit reached. Please wait ${remaining} seconds, then try again.`
        );
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    const remaining = startEmailCooldown();
    setCooldownSeconds(remaining);
    setSuccess(
      "Check your email! We sent you a login link. You can request another in 1 minute."
    );
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildOAuthRedirectUrl(),
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mb-6 flex justify-center">
          <BrandLogo showDomain />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-brand-text">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-brand-muted">
          {mode === "login"
            ? "Sign in to manage your ZAQONE.FORM dashboard"
            : "Start collecting WhatsApp leads in minutes"}
        </p>
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-8 shadow-card">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-brand-red">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-whatsapp/10 px-4 py-3 text-sm text-whatsapp-dark">
            {success}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || cooldownSeconds > 0}
          >
            <Mail className="h-5 w-5" />
            {loading
              ? "Sending..."
              : cooldownSeconds > 0
                ? `Try again in ${cooldownSeconds}s`
                : "Send login link to email"}
          </Button>
        </form>

        {cooldownSeconds > 0 && !error && !success && (
          <p className="mt-3 text-center text-xs text-gray-500">
            Login email cooldown: wait {cooldownSeconds}s before sending another link.
          </p>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Email login is easiest — no Google setup needed.
        </p>

        <p className="mt-6 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold text-whatsapp hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-whatsapp hover:underline">
                Log in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12">
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <AuthForm mode={mode} />
      </Suspense>
    </div>
  );
}
