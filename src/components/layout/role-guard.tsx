import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CurrentUser, UserRole } from "@/lib/types";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userData.user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    user_id: profile.user_id,
    email: profile.email,
    display_name: profile.display_name,
    role: profile.role as UserRole,
    is_verified: profile.is_verified,
    is_suspended: profile.is_suspended,
    trial_ends_at: profile.trial_ends_at,
    subscription_active: profile.subscription_active,
  };
}

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  return requireRole("admin");
}

export async function requireProvider(): Promise<CurrentUser> {
  return requireRole("provider");
}

export async function requireCustomer(): Promise<CurrentUser> {
  return requireRole("customer");
}
