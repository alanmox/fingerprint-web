import { db } from "@/lib/db";

export async function ensureStudentRequirements(studentId: string) {
  const activeItems = await db.requirementItem.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  await db.studentRequirement.createMany({
    data: activeItems.map((item) => ({
      studentId,
      requirementItemId: item.id,
    })),
    skipDuplicates: true,
  });
}

export async function ensureRequirementCoverage(requirementItemId: string) {
  const activeStudents = await db.student.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  await db.studentRequirement.createMany({
    data: activeStudents.map((student) => ({
      studentId: student.id,
      requirementItemId,
    })),
    skipDuplicates: true,
  });
}
