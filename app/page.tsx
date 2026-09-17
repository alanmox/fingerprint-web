import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid">
      <section className="hero hero--station">
        <div className="station-copy">
          <p className="eyebrow">Mloganzila Hospital</p>
          <h1>Field Placement Attendance</h1>
          <p>
            Fingerprint-verified check-in and check-out for students on field
            placement at Mloganzila Hospital, with admin-managed registration
            and reporting.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/admin/login">
              Admin Login
            </Link>
            <Link className="button button--secondary" href="/kiosk">
              Open Kiosk
            </Link>
          </div>
        </div>
        <div className="station-panel">
          <span>System Includes</span>
          <strong>Fingerprint-verified attendance</strong>
          <strong>Student registration &amp; checklist</strong>
          <strong>Daily &amp; range reporting</strong>
        </div>
      </section>
    </div>
  );
}
