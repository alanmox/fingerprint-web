import type { ReactNode } from "react";
import { requireAdminSession } from "@/lib/session";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="admin-shell">
      <AdminNav email={session.email} />
      <div className="admin-content">{children}</div>
    </div>
  );
}
