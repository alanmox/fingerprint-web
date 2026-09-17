import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/session";
import { fingerprintDevice } from "@/lib/fingerprintDevice";
import { FingerprintDeviceError } from "@/lib/fingerprintDevice/localService";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const device = await fingerprintDevice.getDeviceInfo();
    return NextResponse.json({ connected: true, device });
  } catch (caughtError) {
    const message =
      caughtError instanceof FingerprintDeviceError ||
      caughtError instanceof Error
        ? caughtError.message
        : "Unable to reach the fingerprint scanner service.";

    return NextResponse.json(
      { connected: false, error: message },
      { status: 503 },
    );
  }
}
