import { db } from "@/lib/db";
import { getTotals } from "@/lib/attendanceReports";

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthValue() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

export default async function TotalsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const fromDate = from ?? firstOfMonthValue();
  const toDate = to ?? todayValue();

  const fieldSite = await db.fieldSite.findFirst();

  if (!fieldSite) {
    return <p className="status status--error">No field site configured.</p>;
  }

  const totals = await getTotals(
    fieldSite.id,
    new Date(fromDate),
    new Date(toDate),
  );

  return (
    <div className="grid">
      <section className="card">
        <div className="card__header report-filters">
          <p className="eyebrow">Totals</p>
          <h2>Attendance Totals by Range</h2>
        </div>
        <form className="stack-inline report-filters">
          <div className="field">
            <label htmlFor="from">From</label>
            <input defaultValue={fromDate} id="from" name="from" type="date" />
          </div>
          <div className="field">
            <label htmlFor="to">To</label>
            <input defaultValue={toDate} id="to" name="to" type="date" />
          </div>
          <button className="button button--secondary" type="submit">
            Load
          </button>
          <a
            className="button button--secondary"
            href={`/api/admin/reports/totals/export?from=${fromDate}&to=${toDate}`}
          >
            Export CSV
          </a>
        </form>
      </section>

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Days Present</th>
              <th>Total Hours</th>
              <th>Incomplete Days</th>
            </tr>
          </thead>
          <tbody>
            {totals
              .sort((a, b) => b.totalHours - a.totalHours)
              .map((row) => (
                <tr key={row.studentId}>
                  <td>{row.studentName}</td>
                  <td>{row.daysPresent}</td>
                  <td>{row.totalHours.toFixed(1)}</td>
                  <td>{row.incompleteDays}</td>
                </tr>
              ))}
            {totals.length === 0 ? (
              <tr>
                <td colSpan={4}>No attendance recorded in this range.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
