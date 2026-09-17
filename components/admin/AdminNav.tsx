"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/Button";

const LINKS = [
  { href: "/admin/students", label: "Students" },
  { href: "/admin/reports/today", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="admin-nav">
      <div className="admin-nav__brand">
        <strong>Mloganzila Field Desk</strong>
        <span>{email}</span>
      </div>
      <nav className="admin-nav__links">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            className={pathname.startsWith(link.href) ? "admin-nav__link admin-nav__link--active" : "admin-nav__link"}
            href={link.href}
          >
            {link.label}
          </Link>
        ))}
        <Link className="admin-nav__link" href="/kiosk" target="_blank">
          Open Kiosk ↗
        </Link>
      </nav>
      <Button onClick={handleLogout} type="button" variant="secondary">
        Log Out
      </Button>
    </header>
  );
}
