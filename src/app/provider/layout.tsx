import { Navbar } from "@/components/layout/navbar";
import { requireProvider } from "@/components/layout/role-guard";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireProvider();

  return (
    <div>
      <Navbar userRole="provider" userName={user.display_name} />
      <main className="max-w-7xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
