"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { useState } from "react";

interface NavbarProps {
  userRole?: "customer" | "provider" | "admin";
  userName?: string;
}

export function Navbar({ userRole, userName }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navigationLinks = {
    customer: [
      { label: "Dashboard", href: "/customer/dashboard" },
      { label: "My Jobs", href: "/customer/jobs" },
      { label: "New Job", href: "/customer/jobs/new" },
    ],
    provider: [
      { label: "Dashboard", href: "/provider/dashboard" },
      { label: "Jobs", href: "/provider/jobs" },
      { label: "Profile", href: "/provider/profile" },
    ],
    admin: [
      { label: "Dashboard", href: "/admin/dashboard" },
      { label: "Jobs", href: "/admin/jobs" },
      { label: "Dispatch", href: "/admin/dispatch" },
      { label: "Disputes", href: "/admin/disputes" },
      { label: "Verifications", href: "/admin/verifications" },
      { label: "Users", href: "/admin/users" },
    ],
  };

  const links = userRole && navigationLinks[userRole] ? navigationLinks[userRole] : [];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-brand-600">
            BidForJunk
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-brand-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {userRole && (
              <div className="flex items-center gap-4 border-l border-gray-200 pl-4">
                {userName && <span className="text-gray-700">{userName}</span>}
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-3 border-t border-gray-200 pt-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {userRole && (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
