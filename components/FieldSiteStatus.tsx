export function FieldSiteStatus({
  name,
  location,
  isExpectedDay,
}: {
  name: string;
  location: string;
  isExpectedDay: boolean;
}) {
  return (
    <div className="live-feed__row">
      <div>
        <strong>{name}</strong>
        <p style={{ margin: "0.15rem 0 0", color: "var(--muted)" }}>
          {location}
        </p>
      </div>
      <span
        className={`badge ${isExpectedDay ? "badge--success" : "badge--muted"}`}
      >
        {isExpectedDay ? "Expected today" : "Not scheduled today"}
      </span>
    </div>
  );
}
