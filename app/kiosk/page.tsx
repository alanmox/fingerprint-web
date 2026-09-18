import { requireAdminSession } from "@/lib/session";
import { db } from "@/lib/db";
import { KioskScanner } from "@/components/kiosk/KioskScanner";

export default async function KioskPage() {
  await requireAdminSession();
  const fieldSite = await db.fieldSite.findFirst();

  return <KioskScanner fieldSiteName={fieldSite?.name} />;
}
