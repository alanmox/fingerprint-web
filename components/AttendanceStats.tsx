type Stat = { label: string; value: number };

export function AttendanceStats({
  expectedToday,
  present,
  checkedOut,
  late,
  absent,
}: {
  expectedToday: number;
  present: number;
  checkedOut: number;
  late: number;
  absent: number;
}) {
  const stats: Stat[] = [
    { label: "Expected Today", value: expectedToday },
    { label: "Present", value: present },
    { label: "Checked Out", value: checkedOut },
    { label: "Late", value: late },
    { label: "Absent", value: absent },
  ];

  return (
    <div className="dashboard-stats">
      {stats.map((stat) => (
        <div className="dashboard-stat" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      ))}
    </div>
  );
}
