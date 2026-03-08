import { Navbar } from "@/components/layout/navbar";
import { requireAdmin } from "@/components/layout/role-guard";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div>
      <Navbar userRole="admin" userName={user.display_name} />
      <main className="max-w-7xl mx-auto px-6 py-12">{children}</main>
    </div>
  );
}
