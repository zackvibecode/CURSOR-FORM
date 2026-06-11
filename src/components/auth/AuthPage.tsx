"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { requestPasswordReset } from "@/lib/auth/actions";
import { safeRedirectPath } from "@/lib/auth/safe-path";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LogIn, Mail, UserPlus } from "lucide-react";

function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const template = searchParams.get("template");
  const selectedPlan = searchParams.get("plan");
  const billingCycle = searchParams.get("cycle") || "monthly";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get("error") === "auth"
      ? "Login link expired or invalid. Please try again."
      : ""
  );
  const [success, setSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const getDashboardUrl = () => {
    if (template) return `/dashboard?template=${template}`;
    return safeRedirectPath(redirect);
  };

  const appendPlanParams = (url: URL) => {
    if (mode === "signup" && selectedPlan) {
      url.searchParams.set("plan", selectedPlan);
      url.searchParams.set("cycle", billingCycle);
    }
  };

  const buildConfirmUrl = () => {
    const redirectTo = new URL("/auth/confirm", window.location.origin);
    redirectTo.searchParams.set("next", getDashboardUrl());
    if (template) redirectTo.searchParams.set("template", template);
    appendPlanParams(redirectTo);
    return redirectTo.toString();
  };

  const buildCallbackUrl = () => {
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", getDashboardUrl());
    if (template) redirectTo.searchParams.set("template", template);
    appendPlanParams(redirectTo);
    return redirectTo.toString();
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setShowForgotPassword(false);

    if (!email.trim()) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(mode === "signup" && selectedPlan
            ? { plan: selectedPlan, cycle: billingCycle }
            : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      // If signup returned a message (email confirmation required)
      if (data.message) {
        setSuccess(data.message);
        setLoading(false);
        return;
      }

      window.location.href = getDashboardUrl();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: buildConfirmUrl(),
        shouldCreateUser: mode === "signup",
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess("Check your email! Click the login link to enter the dashboard.");
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Enter your email address first.");
      setLoading(false);
      return;
    }

    const result = await requestPasswordReset(email);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
      setShowForgotPassword(false);
    }

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
        redirectTo: buildCallbackUrl(),
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
          <BrandLogo />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-brand-text">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-brand-muted">
          {mode === "login"
            ? "Sign in to manage your OneForm dashboard"
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

        <form onSubmit={handlePasswordAuth} className="space-y-4">
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

          {!showForgotPassword && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold">
                  Password
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError("");
                      setSuccess("");
                    }}
                    className="text-xs font-semibold text-whatsapp hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required={!showForgotPassword}
                minLength={6}
              />
            </div>
          )}

          {showForgotPassword ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                We will email you a link to set a new password.
              </p>
              <Button type="button" className="w-full" disabled={loading} onClick={handleForgotPassword}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-center text-sm text-gray-500 hover:text-brand-text"
              >
                Back to login
              </button>
            </div>
          ) : (
            <Button type="submit" className="w-full" disabled={loading}>
              {mode === "login" ? (
                <LogIn className="h-5 w-5" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
              {loading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Log in with password"
                  : "Create account"}
            </Button>
          )}
        </form>

        {mode === "login" && !showForgotPassword && (
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            disabled={loading}
            onClick={handleMagicLink}
          >
            <Mail className="h-5 w-5" />
            {loading ? "Sending..." : "Send login link to email"}
          </Button>
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

        {mode === "login" && (
          <p className="mt-4 text-center text-xs text-gray-500">
            Account lama? Guna &quot;Send login link to email&quot; atau Google.
          </p>
        )}

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
