import { db } from "@/lib/db";
import { RequirementItemsManager } from "@/components/admin/RequirementItemsManager";

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function SettingsPage() {
  const fieldSite = await db.fieldSite.findFirst();
  const requirementItems = await db.requirementItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const expectedWeekdays = Array.isArray(fieldSite?.expectedWeekdays)
    ? (fieldSite.expectedWeekdays as number[])
    : [];

  return (
    <div className="grid">
      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Field Site</p>
          <h2>{fieldSite?.name ?? "Not configured"}</h2>
        </div>
        {fieldSite ? (
          <dl className="checklist">
            <div className="checklist__item">
              <label>Location</label>
              <span>{fieldSite.location}</span>
            </div>
            <div className="checklist__item">
              <label>Expected start time</label>
              <span>{formatTime(fieldSite.expectedStartMinutes)}</span>
            </div>
            <div className="checklist__item">
              <label>Late grace period</label>
              <span>{fieldSite.lateGraceMinutes} minutes</span>
            </div>
            <div className="checklist__item">
              <label>Expected days</label>
              <span>{expectedWeekdays.map((day) => WEEKDAY_LABELS[day]).join(", ")}</span>
            </div>
          </dl>
        ) : (
          <p className="status status--error">
            No field site is configured. Run the database seed script.
          </p>
        )}
      </section>

      <section className="card">
        <div className="card__header">
          <p className="eyebrow">Registration Checklist</p>
          <h2>Requirement Items</h2>
          <p>
            Students must complete every active requirement below, plus fingerprint enrollment,
            before they can use kiosk attendance scanning.
          </p>
        </div>
        <RequirementItemsManager initialItems={requirementItems} />
      </section>
    </div>
  );
}
