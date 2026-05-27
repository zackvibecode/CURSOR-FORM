"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, findUserIdByEmail, setUserPassword } from "@/lib/supabase/admin";

export type AuthActionResult = {
  error?: string;
  success?: string;
};

function getRedirectPath(path: string) {
  return path.startsWith("/") ? path : "/dashboard";
}

function getAuthCallbackUrl(nextPath: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = new URL("/auth/callback", base);
  url.searchParams.set("next", getRedirectPath(nextPath));
  return url.toString();
}

function isEmailNotConfirmed(message: string) {
  return message.toLowerCase().includes("email not confirmed");
}

function completeAuthRedirect(redirectPath: string): never {
  revalidatePath("/", "layout");
  redirect(getRedirectPath(redirectPath));
}

async function authenticateWithEmail(
  email: string,
  password: string,
  redirectPath: string
): Promise<AuthActionResult> {
  const trimmedEmail = email.trim();
  const safeRedirect = getRedirectPath(redirectPath);
  const supabase = await createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (!signInError) {
    completeAuthRedirect(safeRedirect);
  }

  const existingUserId = await findUserIdByEmail(trimmedEmail);

  if (existingUserId) {
    if (!createAdminClient()) {
      return {
        error:
          "This email is already registered but password login failed. Add SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables, redeploy, then try again.",
      };
    }

    const { error: updateError } = await setUserPassword(existingUserId, password);
    if (updateError) {
      return { error: updateError };
    }

    const { error: retryError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (!retryError) {
      completeAuthRedirect(safeRedirect);
    }

    return { error: retryError?.message ?? "Could not sign in after updating password." };
  }

  const { data, error: signUpError } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(safeRedirect),
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (data.session) {
    completeAuthRedirect(safeRedirect);
  }

  const { error: newUserSignInError } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (!newUserSignInError) {
    completeAuthRedirect(safeRedirect);
  }

  if (newUserSignInError && isEmailNotConfirmed(newUserSignInError.message)) {
    return {
      success:
        "Account created! Check your email and click the confirmation link, then log in.",
    };
  }

  return {
    error: newUserSignInError?.message ?? signInError?.message ?? "Authentication failed.",
  };
}

export async function signInWithEmail(
  email: string,
  password: string,
  redirectPath: string
): Promise<AuthActionResult> {
  return authenticateWithEmail(email, password, redirectPath);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  redirectPath: string
): Promise<AuthActionResult> {
  return authenticateWithEmail(email, password, redirectPath);
}

export async function requestPasswordReset(email: string): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getAuthCallbackUrl("/auth/update-password"),
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Password reset link sent. Check your inbox.",
  };
}

export async function updatePassword(password: string): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  completeAuthRedirect("/dashboard");
}
