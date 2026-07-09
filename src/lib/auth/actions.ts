"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthConfirmUrl } from "@/lib/auth/urls";
import { safeRedirectPath } from "@/lib/auth/safe-path";

export type AuthActionResult = {
  error?: string;
  success?: string;
};

function isEmailNotConfirmed(message: string) {
  return message.toLowerCase().includes("email not confirmed");
}

function completeAuthRedirect(redirectPath: string): never {
  revalidatePath("/", "layout");
  redirect(safeRedirectPath(redirectPath));
}

export async function signInWithEmail(
  email: string,
  password: string,
  redirectPath: string
): Promise<AuthActionResult> {
  const trimmedEmail = email.trim();
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  completeAuthRedirect(redirectPath);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  redirectPath: string
): Promise<AuthActionResult> {
  const trimmedEmail = email.trim();
  const safeRedirect = safeRedirectPath(redirectPath);
  const supabase = await createClient();

  const { data, error: signUpError } = await supabase.auth.signUp({
    email: trimmedEmail,
    password,
    options: {
      emailRedirectTo: getAuthConfirmUrl(safeRedirect),
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  if (data.session) {
    completeAuthRedirect(safeRedirect);
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (!signInError) {
    completeAuthRedirect(safeRedirect);
  }

  if (isEmailNotConfirmed(signInError.message)) {
    return {
      success:
        "Account created! Check your email and click the confirmation link, then log in.",
    };
  }

  return { error: signInError.message };
}

export async function requestPasswordReset(email: string): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getAuthConfirmUrl("/auth/update-password"),
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

  completeAuthRedirect("/dashboard/forms");
}
