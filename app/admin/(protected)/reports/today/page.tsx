import Link from "next/link";
import { db } from "@/lib/db";
import { getTodayStatus } from "@/lib/attendanceReports";

export const dynamic = "force-dynamic";

export default async function TodayReportPage() {
  const fieldSite = await db.fieldSite.findFirst();

  if (!fieldSite) {
    return <p className="status status--error">No field site configured.</p>;
  }

  const { present, checkedOut } = await getTodayStatus(fieldSite.id);

  return (
    <div className="grid">
      <section className="card">
        <div className="card__header report-filters">
          <p className="eyebrow">Live Status</p>
          <h2>Today — {new Date().toLocaleDateString()}</h2>
        </div>
        <div className="stack-inline">
          <Link
            className="button button--secondary"
            href="/admin/reports/daily"
          >
            Daily Sheet
          </Link>
          <Link
            className="button button--secondary"
            href="/admin/reports/totals"
          >
            Totals
          </Link>
          <Link
            className="button button--secondary"
            href="/admin/reports/flags"
          >
            Late &amp; Absent
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <p className="eyebrow">On Site</p>
          <h2>Currently Present ({present.length})</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Checked In</th>
            </tr>
          </thead>
          <tbody>
            {present.map((record) => (
              <tr key={record.id}>
                <td>{record.student.fullName}</td>
                <td>{new Date(record.checkInAt).toLocaleTimeString()}</td>
              </tr>
            ))}
            {present.length === 0 ? (
              <tr>
                <td colSpan={2}>No one currently checked in.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Departed</p>
          <h2>Checked Out ({checkedOut.length})</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Checked In</th>
              <th>Checked Out</th>
            </tr>
          </thead>
          <tbody>
            {checkedOut.map((record) => (
              <tr key={record.id}>
                <td>{record.student.fullName}</td>
                <td>{new Date(record.checkInAt).toLocaleTimeString()}</td>
                <td>
                  {record.checkOutAt
                    ? new Date(record.checkOutAt).toLocaleTimeString()
                    : "—"}
                </td>
              </tr>
            ))}
            {checkedOut.length === 0 ? (
              <tr>
                <td colSpan={3}>No one has checked out yet today.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
