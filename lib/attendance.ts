import { db } from "@/lib/db";

export type ScanAction = "check-in" | "check-out" | "already-complete";

/**
 * Resolves what a fresh fingerprint scan means for a student: the first
 * scan of the day checks them in, the next scan (while still checked in)
 * checks them out, and any further scan that day is a no-op. Assumes the
 * server's local clock/timezone matches the field site (the app only ever
 * runs on-site, on the kiosk machine) — no timezone conversion is done.
 */
export async function resolveScanAction(
  studentId: string,
  fieldSiteId: string,
  now: Date,
  matchScore?: number,
): Promise<{ action: ScanAction; recordId: string | null }> {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const existing = await db.attendanceRecord.findUnique({
    where: { studentId_date: { studentId, date: startOfDay } },
  });

  if (!existing) {
    const record = await db.attendanceRecord.create({
      data: {
        studentId,
        fieldSiteId,
        date: startOfDay,
        checkInAt: now,
        checkInMatchScore: matchScore,
      },
    });

    return { action: "check-in", recordId: record.id };
  }

  if (!existing.checkOutAt) {
    const record = await db.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOutAt: now, checkOutMatchScore: matchScore },
    });

    return { action: "check-out", recordId: record.id };
  }

  return { action: "already-complete", recordId: existing.id };
}
