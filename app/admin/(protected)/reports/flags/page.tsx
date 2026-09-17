import { db } from "@/lib/db";
import { getFlags } from "@/lib/attendanceReports";

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function FlagsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const selectedDate = date ?? todayValue();

  const fieldSite = await db.fieldSite.findFirst();

  if (!fieldSite) {
    return <p className="status status--error">No field site configured.</p>;
  }

  const { lateArrivals, absences } = await getFlags(
    fieldSite.id,
    new Date(selectedDate),
  );

  return (
    <div className="grid">
      <section className="card">
        <div className="card__header report-filters">
          <p className="eyebrow">Late &amp; Absent</p>
          <h2>Attendance Flags</h2>
        </div>
        <form className="stack-inline report-filters">
          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              defaultValue={selectedDate}
              id="date"
              name="date"
              type="date"
            />
          </div>
          <button className="button button--secondary" type="submit">
            Load
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Late Arrivals</p>
          <h2>{lateArrivals.length}</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Checked In</th>
            </tr>
          </thead>
          <tbody>
            {lateArrivals.map((entry) => (
              <tr key={entry.studentName}>
                <td>{entry.studentName}</td>
                <td>{new Date(entry.checkInAt).toLocaleTimeString()}</td>
              </tr>
            ))}
            {lateArrivals.length === 0 ? (
              <tr>
                <td colSpan={2}>No late arrivals.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Absences</p>
          <h2>{absences.length}</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
            </tr>
          </thead>
          <tbody>
            {absences.map((entry) => (
              <tr key={entry.studentName}>
                <td>{entry.studentName}</td>
              </tr>
            ))}
            {absences.length === 0 ? (
              <tr>
                <td>No absences for this expected day.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
