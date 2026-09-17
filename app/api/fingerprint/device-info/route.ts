import { NextResponse } from "next/server";
import { RdServiceError, getDeviceInfo } from "@/lib/mantraRdService";

export async function GET() {
  try {
    const device = await getDeviceInfo();
    return NextResponse.json({ connected: true, device });
  } catch (caughtError) {
    const message =
      caughtError instanceof RdServiceError || caughtError instanceof Error
        ? caughtError.message
        : "Unable to reach the fingerprint scanner service.";

    return NextResponse.json(
      { connected: false, error: message },
      { status: 503 },
    );
  }
}
