type DailyRow = {
  student: { fullName: string; registrationNumber: string };
  record: { checkInAt: Date; checkOutAt: Date | null } | null;
};

export function PrintableAttendanceSheet({
  fieldSiteName,
  date,
  rows,
}: {
  fieldSiteName: string;
  date: string;
  rows: DailyRow[];
}) {
  return (
    <article className="printable-sheet">
      <header className="printable-sheet__header">
        <div>
          <p className="eyebrow">{fieldSiteName}</p>
          <h2>Daily Attendance Sheet</h2>
        </div>
        <span>Date: {date}</span>
      </header>

      <table className="table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Registration No.</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ student, record }) => (
            <tr key={student.registrationNumber}>
              <td>{student.fullName}</td>
              <td>{student.registrationNumber}</td>
              <td>
                {record ? new Date(record.checkInAt).toLocaleTimeString() : "—"}
              </td>
              <td>
                {record?.checkOutAt
                  ? new Date(record.checkOutAt).toLocaleTimeString()
                  : "—"}
              </td>
              <td>
                {record
                  ? record.checkOutAt
                    ? "Complete"
                    : "On site"
                  : "Absent"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </article>
  );
}
