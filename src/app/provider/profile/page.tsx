import { requireProvider } from "@/components/layout/role-guard";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "./profile-edit-form";

export default async function ProviderProfilePage() {
  const user = await requireProvider();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>
      <ProfileEditForm profile={profile} />
    </div>
  );
}
