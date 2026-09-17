import { db } from "@/lib/db";

export type EligibilityResult = {
  eligible: boolean;
  reasons: string[];
};

export async function isStudentEligibleForKiosk(
  studentId: string,
): Promise<EligibilityResult> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      fingerprintTemplate: true,
      requirements: {
        where: { requirementItem: { isActive: true } },
        include: { requirementItem: true },
      },
    },
  });

  if (!student) {
    return { eligible: false, reasons: ["Student not found."] };
  }

  const reasons: string[] = [];

  if (!student.isActive) {
    reasons.push("Student is inactive.");
  }

  if (!student.fingerprintTemplate) {
    reasons.push("Fingerprint not enrolled.");
  }

  const incomplete = student.requirements.filter(
    (requirement) => !requirement.isComplete,
  );

  for (const requirement of incomplete) {
    reasons.push(
      `Requirement not complete: ${requirement.requirementItem.label}`,
    );
  }

  return { eligible: reasons.length === 0, reasons };
}
