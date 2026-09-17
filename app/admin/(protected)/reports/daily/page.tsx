import { db } from "@/lib/db";
import { getDailySheet } from "@/lib/attendanceReports";
import { PrintableAttendanceSheet } from "@/components/admin/PrintableAttendanceSheet";
import { PrintPageButton } from "@/components/admin/PrintPageButton";

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default async function DailyReportPage({
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

  const rows = await getDailySheet(fieldSite.id, new Date(selectedDate));

  return (
    <div className="grid">
      <section className="card">
        <div className="card__header report-filters">
          <p className="eyebrow">Daily Sheet</p>
          <h2>Attendance by Date</h2>
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
          <a
            className="button button--secondary"
            href={`/api/admin/reports/daily/export?date=${selectedDate}`}
          >
            Export CSV
          </a>
          <PrintPageButton />
        </form>
      </section>

      <PrintableAttendanceSheet
        date={selectedDate}
        fieldSiteName={fieldSite.name}
        rows={rows}
      />
    </div>
  );
}
