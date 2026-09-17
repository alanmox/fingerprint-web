import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isStudentEligibleForKiosk } from "@/lib/eligibility";
import { RequirementChecklist } from "@/components/admin/RequirementChecklist";
import { FingerprintEnroll } from "@/components/admin/FingerprintEnroll";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const student = await db.student.findUnique({
    where: { id },
    include: {
      fingerprintTemplate: true,
      requirements: { include: { requirementItem: true } },
      attendanceRecords: { orderBy: { date: "desc" }, take: 10 },
    },
  });

  if (!student) {
    notFound();
  }

  const eligibility = await isStudentEligibleForKiosk(id);

  return (
    <div className="grid">
      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Student Profile</p>
          <h2>{student.fullName}</h2>
          <p>
            {student.registrationNumber} · {student.program}, Year{" "}
            {student.yearOfStudy} · {student.university}
          </p>
        </div>

        <div
          className={`eligibility-banner ${eligibility.eligible ? "eligibility-banner--ok" : "eligibility-banner--blocked"}`}
        >
          {eligibility.eligible
            ? "Eligible for kiosk attendance scanning."
            : `Not yet eligible: ${eligibility.reasons.join("; ")}`}
        </div>

        <div className="stack-inline">
          <Link
            className="button button--secondary"
            href={`/admin/students/${id}/edit`}
          >
            Edit Profile
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Registration Checklist</p>
          <h2>Requirements</h2>
        </div>
        <RequirementChecklist
          initialRequirements={student.requirements.map((requirement) => ({
            requirementItemId: requirement.requirementItemId,
            label: requirement.requirementItem.label,
            isComplete: requirement.isComplete,
          }))}
          studentId={id}
        />
      </section>

      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Biometric Enrollment</p>
          <h2>Fingerprint</h2>
        </div>
        <FingerprintEnroll
          existingTemplate={
            student.fingerprintTemplate
              ? {
                  quality: student.fingerprintTemplate.quality,
                  capturedAtIso:
                    student.fingerprintTemplate.capturedAt.toISOString(),
                  deviceSerial: student.fingerprintTemplate.deviceSerial,
                }
              : null
          }
          studentId={id}
        />
      </section>

      <section className="card">
        <div className="card__header">
          <p className="eyebrow">History</p>
          <h2>Recent Attendance</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check-in</th>
              <th>Check-out</th>
            </tr>
          </thead>
          <tbody>
            {student.attendanceRecords.map((record) => (
              <tr key={record.id}>
                <td>{record.date.toISOString().slice(0, 10)}</td>
                <td>{new Date(record.checkInAt).toLocaleTimeString()}</td>
                <td>
                  {record.checkOutAt
                    ? new Date(record.checkOutAt).toLocaleTimeString()
                    : "Still on site"}
                </td>
              </tr>
            ))}
            {student.attendanceRecords.length === 0 ? (
              <tr>
                <td colSpan={3}>No attendance recorded yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
