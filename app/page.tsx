import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid">
      <section className="hero hero--station">
        <div className="station-copy">
          <p className="eyebrow">ALLANTECH Field Intake</p>
          <h1>Record a thumb impression the way an operator actually works.</h1>
          <p>
            This workspace is built for practical intake: open it on a phone, capture the
            thumb cleanly, prepare a blue-ink impression, and issue the letter from the same desk.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/register">
              Open Intake Desk
            </Link>
            <Link className="button button--secondary" href="/dashboard">
              Review Letter
            </Link>
          </div>
        </div>
        <div className="station-panel">
          <span>What this tool prepares</span>
          <strong>Camera crop</strong>
          <strong>Blue-ink impression</strong>
          <strong>Issued ALLANTECH record</strong>
        </div>
      </section>
    </div>
  );
}
