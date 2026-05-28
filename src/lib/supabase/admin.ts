import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function findUserIdByEmail(email: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error || !data.users.length) {
    return null;
  }

  const match = data.users.find(
    (user) => user.email?.toLowerCase() === normalizedEmail
  );
  return match?.id ?? null;
}

export async function setUserPassword(userId: string, password: string) {
  const admin = createAdminClient();
  if (!admin) {
    return { error: "Server auth is not configured. Missing SUPABASE_SERVICE_ROLE_KEY." };
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
