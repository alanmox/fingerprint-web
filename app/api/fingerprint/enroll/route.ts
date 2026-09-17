import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { fingerprintDevice } from "@/lib/fingerprintDevice";
import { FingerprintDeviceError } from "@/lib/fingerprintDevice/localService";

const enrollSchema = z.object({
  studentId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = enrollSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "A studentId is required." },
      { status: 400 },
    );
  }

  const student = await db.student.findUnique({
    where: { id: parsed.data.studentId },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  try {
    const result = await fingerprintDevice.enrollTemplate();

    if (!result.success) {
      return NextResponse.json(
        { success: false, errInfo: result.errInfo },
        { status: 422 },
      );
    }

    const templateHash = createHash("sha256")
      .update(result.template)
      .digest("hex");
    const templateBytes = new Uint8Array(result.template);

    const fingerprintTemplate = await db.fingerprintTemplate.upsert({
      where: { studentId: student.id },
      update: {
        template: templateBytes,
        templateFormat: result.templateFormat,
        templateHash,
        vendorTemplateId: result.vendorTemplateId,
        quality: result.quality,
        deviceSerial: result.device.serial,
        capturedAt: new Date(result.capturedAtIso),
      },
      create: {
        studentId: student.id,
        template: templateBytes,
        templateFormat: result.templateFormat,
        templateHash,
        vendorTemplateId: result.vendorTemplateId,
        quality: result.quality,
        deviceSerial: result.device.serial,
        capturedAt: new Date(result.capturedAtIso),
      },
    });

    return NextResponse.json({
      success: true,
      quality: fingerprintTemplate.quality,
      capturedAtIso: fingerprintTemplate.capturedAt.toISOString(),
      deviceSerial: fingerprintTemplate.deviceSerial,
    });
  } catch (caughtError) {
    const message =
      caughtError instanceof FingerprintDeviceError ||
      caughtError instanceof Error
        ? caughtError.message
        : "Unable to reach the fingerprint scanner service.";

    return NextResponse.json(
      { success: false, errInfo: message },
      { status: 503 },
    );
  }
}
