"use client";

import { useState } from "react";
import { updatePassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mb-6 flex justify-center">
          <BrandLogo showDomain />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-brand-text">Set your password</h1>
        <p className="text-brand-muted">Choose a password to finish setting up your account.</p>
      </div>

      <div className="rounded-2xl border border-brand-border bg-white p-8 shadow-card">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-brand-red">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold">
              New password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold">
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save password and continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
