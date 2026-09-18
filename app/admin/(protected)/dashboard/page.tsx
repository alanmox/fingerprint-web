import { db } from "@/lib/db";
import { getDashboardSummary } from "@/lib/attendanceReports";
import { AttendanceStats } from "@/components/AttendanceStats";
import { FieldSiteStatus } from "@/components/FieldSiteStatus";
import { LiveAttendance } from "@/components/LiveAttendance";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const fieldSite = await db.fieldSite.findFirst();

  if (!fieldSite) {
    return (
      <p className="status status--error">
        No field site is configured. Run the database seed script.
      </p>
    );
  }

  const summary = await getDashboardSummary(fieldSite.id);

  return (
    <div className="grid">
      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Dashboard</p>
          <h2>{fieldSite.name} — {new Date().toLocaleDateString()}</h2>
        </div>
        <AttendanceStats
          expectedToday={summary.expectedToday}
          present={summary.present}
          checkedOut={summary.checkedOut}
          late={summary.late}
          absent={summary.absent}
        />
      </section>

      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Field Site</p>
          <h2>Status</h2>
        </div>
        <FieldSiteStatus
          name={fieldSite.name}
          location={fieldSite.location}
          isExpectedDay={summary.isExpectedDay}
        />
      </section>

      <LiveAttendance
        initial={{
          present: summary.present,
          checkedOut: summary.checkedOut,
          late: summary.late,
          absent: summary.absent,
          failedToday: summary.failedToday,
          lastScanAt: summary.lastScanAt
            ? summary.lastScanAt.toISOString()
            : null,
          recentAttempts: summary.recentAttempts.map((attempt) => ({
            id: attempt.id,
            outcome: attempt.outcome,
            matchedStudentName: attempt.matchedStudentName,
            matchScore: attempt.matchScore,
            createdAt: attempt.createdAt.toISOString(),
          })),
        }}
      />
    </div>
  );
}
