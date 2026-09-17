import { NextResponse } from "next/server";
import { RdServiceError, captureFingerprint } from "@/lib/mantraRdService";

export async function POST() {
  try {
    const result = await captureFingerprint();
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (caughtError) {
    const message =
      caughtError instanceof RdServiceError || caughtError instanceof Error
        ? caughtError.message
        : "Unable to reach the fingerprint scanner service.";

    return NextResponse.json(
      { success: false, errCode: "-1", errInfo: message, qualityScore: 0 },
      { status: 503 },
    );
  }
}
