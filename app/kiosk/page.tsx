import { requireAdminSession } from "@/lib/session";
import { KioskScanner } from "@/components/kiosk/KioskScanner";

export default async function KioskPage() {
  await requireAdminSession();

  return <KioskScanner />;
}
