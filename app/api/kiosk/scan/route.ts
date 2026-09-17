import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import {
  fingerprintDevice,
  isMockMode,
  setMockIdentifyOverride,
} from "@/lib/fingerprintDevice";
import { FingerprintDeviceError } from "@/lib/fingerprintDevice/localService";
import { isStudentEligibleForKiosk } from "@/lib/eligibility";
import { resolveScanAction } from "@/lib/attendance";

async function logAttempt(
  fieldSiteId: string,
  outcome: "matched" | "no_match" | "ineligible" | "device_error",
  matchedStudentId?: string,
  matchScore?: number,
) {
  await db.identifyAttempt.create({
    data: { fieldSiteId, outcome, matchedStudentId, matchScore },
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fieldSite = await db.fieldSite.findFirst();

  if (!fieldSite) {
    return NextResponse.json(
      { error: "No field site is configured." },
      { status: 500 },
    );
  }

  if (isMockMode) {
    const override = request.headers.get("x-mock-identify");
    setMockIdentifyOverride(override);
  }

  try {
    const result = await fingerprintDevice.identify();

    if (!result.success) {
      await logAttempt(fieldSite.id, "device_error");
      return NextResponse.json(
        { outcome: "device_error", message: result.errInfo },
        { status: 503 },
      );
    }

    if (!result.matched) {
      await logAttempt(fieldSite.id, "no_match");
      return NextResponse.json(
        { outcome: "no_match", message: "Fingerprint not recognized." },
        { status: 404 },
      );
    }

    const fingerprintTemplate = await db.fingerprintTemplate.findFirst({
      where: { vendorTemplateId: result.vendorTemplateId },
      include: { student: true },
    });

    if (!fingerprintTemplate) {
      await logAttempt(fieldSite.id, "no_match", undefined, result.matchScore);
      return NextResponse.json(
        { outcome: "no_match", message: "Fingerprint not recognized." },
        { status: 404 },
      );
    }

    const student = fingerprintTemplate.student;
    const eligibility = await isStudentEligibleForKiosk(student.id);

    if (!eligibility.eligible) {
      await logAttempt(
        fieldSite.id,
        "ineligible",
        student.id,
        result.matchScore,
      );
      return NextResponse.json(
        {
          outcome: "ineligible",
          message: `Registration incomplete for ${student.fullName}: ${eligibility.reasons.join("; ")}`,
        },
        { status: 403 },
      );
    }

    const { action } = await resolveScanAction(
      student.id,
      fieldSite.id,
      new Date(),
      result.matchScore,
    );

    await logAttempt(fieldSite.id, "matched", student.id, result.matchScore);

    return NextResponse.json({
      outcome: "matched",
      action,
      studentName: student.fullName,
      timestamp: new Date().toISOString(),
    });
  } catch (caughtError) {
    await logAttempt(fieldSite.id, "device_error");
    const message =
      caughtError instanceof FingerprintDeviceError ||
      caughtError instanceof Error
        ? caughtError.message
        : "Unable to reach the fingerprint scanner service.";

    return NextResponse.json(
      { outcome: "device_error", message },
      { status: 503 },
    );
  }
}
