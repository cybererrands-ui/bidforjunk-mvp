import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { redirect } from "next/navigation";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("user_id", user.id)
    .single();

  return (
    <>
      <Navbar
        userRole={(profile?.role as "customer" | "provider" | "admin") ?? "customer"}
        userName={profile?.display_name ?? user.email ?? ""}
      />
      {children}
    </>
  );
}
