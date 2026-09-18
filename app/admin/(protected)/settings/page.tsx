import { db } from "@/lib/db";
import { RequirementItemsManager } from "@/components/admin/RequirementItemsManager";
import { FieldSiteForm } from "@/components/admin/FieldSiteForm";

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
          <FieldSiteForm
            initial={{
              name: fieldSite.name,
              location: fieldSite.location,
              expectedStartMinutes: fieldSite.expectedStartMinutes,
              lateGraceMinutes: fieldSite.lateGraceMinutes,
              expectedWeekdays,
            }}
          />
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
            Students must complete every active requirement below, plus
            fingerprint enrollment, before they can use kiosk attendance
            scanning.
          </p>
        </div>
        <RequirementItemsManager initialItems={requirementItems} />
      </section>
    </div>
  );
}
