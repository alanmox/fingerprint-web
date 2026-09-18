import { db } from "@/lib/db";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function getTodayStatus(fieldSiteId: string) {
  const today = startOfDay(new Date());

  const records = await db.attendanceRecord.findMany({
    where: { fieldSiteId, date: today },
    include: { student: true },
    orderBy: { checkInAt: "asc" },
  });

  return {
    present: records.filter((record) => !record.checkOutAt),
    checkedOut: records.filter((record) => record.checkOutAt),
  };
}

export async function getDailySheet(fieldSiteId: string, date: Date) {
  const day = startOfDay(date);

  const students = await db.student.findMany({
    where: { fieldSiteId, isActive: true },
    include: {
      attendanceRecords: { where: { date: day } },
    },
    orderBy: { fullName: "asc" },
  });

  return students.map((student) => ({
    student,
    record: student.attendanceRecords[0] ?? null,
  }));
}

export async function getTotals(fieldSiteId: string, from: Date, to: Date) {
  const records = await db.attendanceRecord.findMany({
    where: {
      fieldSiteId,
      date: { gte: startOfDay(from), lte: startOfDay(to) },
    },
    include: { student: true },
  });

  const totalsByStudent = new Map<
    string,
    {
      studentName: string;
      totalMs: number;
      daysPresent: number;
      incompleteDays: number;
    }
  >();

  for (const record of records) {
    const entry = totalsByStudent.get(record.studentId) ?? {
      studentName: record.student.fullName,
      totalMs: 0,
      daysPresent: 0,
      incompleteDays: 0,
    };

    entry.daysPresent += 1;

    if (record.checkOutAt) {
      entry.totalMs += record.checkOutAt.getTime() - record.checkInAt.getTime();
    } else {
      entry.incompleteDays += 1;
    }

    totalsByStudent.set(record.studentId, entry);
  }

  return Array.from(totalsByStudent.entries()).map(([studentId, entry]) => ({
    studentId,
    ...entry,
    totalHours: entry.totalMs / (1000 * 60 * 60),
  }));
}

export async function getDashboardSummary(fieldSiteId: string) {
  const today = startOfDay(new Date());
  const fieldSite = await db.fieldSite.findUnique({ where: { id: fieldSiteId } });

  const [activeStudentCount, { present, checkedOut }, recentAttempts, failedToday] =
    await Promise.all([
      db.student.count({ where: { fieldSiteId, isActive: true } }),
      getTodayStatus(fieldSiteId),
      db.identifyAttempt.findMany({
        where: { fieldSiteId },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { matchedStudent: { select: { fullName: true } } },
      }),
      db.identifyAttempt.count({
        where: {
          fieldSiteId,
          createdAt: { gte: today },
          outcome: { in: ["no_match", "ineligible", "device_error"] },
        },
      }),
    ]);

  const expectedWeekdays = Array.isArray(fieldSite?.expectedWeekdays)
    ? (fieldSite.expectedWeekdays as number[])
    : [];
  const isExpectedDay = expectedWeekdays.includes(today.getDay());

  const { lateArrivals, absences } = await getFlags(fieldSiteId, today);

  return {
    fieldSite,
    isExpectedDay,
    expectedToday: isExpectedDay ? activeStudentCount : 0,
    present: present.length,
    checkedOut: checkedOut.length,
    late: lateArrivals.length,
    absent: absences.length,
    failedToday,
    lastScanAt: recentAttempts[0]?.createdAt ?? null,
    recentAttempts: recentAttempts.map((attempt) => ({
      id: attempt.id,
      outcome: attempt.outcome,
      matchedStudentName: attempt.matchedStudent?.fullName ?? null,
      matchScore: attempt.matchScore,
      createdAt: attempt.createdAt,
    })),
  };
}

export async function getFlags(fieldSiteId: string, date: Date) {
  const day = startOfDay(date);
  const fieldSite = await db.fieldSite.findUnique({
    where: { id: fieldSiteId },
  });

  if (!fieldSite) {
    return { lateArrivals: [], absences: [] };
  }

  const expectedWeekdays = Array.isArray(fieldSite.expectedWeekdays)
    ? (fieldSite.expectedWeekdays as number[])
    : [];

  const isExpectedDay = expectedWeekdays.includes(day.getDay());

  const students = await db.student.findMany({
    where: { fieldSiteId, isActive: true },
    include: {
      fingerprintTemplate: true,
      requirements: { where: { requirementItem: { isActive: true } } },
      attendanceRecords: { where: { date: day } },
    },
  });

  const thresholdMinutes =
    fieldSite.expectedStartMinutes + fieldSite.lateGraceMinutes;

  const lateArrivals: { studentName: string; checkInAt: Date }[] = [];
  const absences: { studentName: string }[] = [];

  for (const student of students) {
    const eligible =
      Boolean(student.fingerprintTemplate) &&
      student.requirements.every((requirement) => requirement.isComplete);

    if (!eligible) {
      continue;
    }

    const record = student.attendanceRecords[0];

    if (record) {
      const checkInMinutes =
        record.checkInAt.getHours() * 60 + record.checkInAt.getMinutes();

      if (checkInMinutes > thresholdMinutes) {
        lateArrivals.push({
          studentName: student.fullName,
          checkInAt: record.checkInAt,
        });
      }
    } else if (isExpectedDay) {
      absences.push({ studentName: student.fullName });
    }
  }

  return { lateArrivals, absences };
}
