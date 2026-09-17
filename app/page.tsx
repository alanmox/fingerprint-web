import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid">
      <section className="hero hero--station">
        <div className="station-copy">
          <p className="eyebrow">ALLANTECH Organization</p>
          <h1>Official Thumb Impression Capture</h1>
          <p>
            Capture a verified fingerprint using a certified Mantra MFS500
            biometric scanner and generate a professional document suitable for
            official records.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/register">
              Start Capture
            </Link>
            <Link className="button button--secondary" href="/dashboard">
              View Document
            </Link>
          </div>
        </div>
        <div className="station-panel">
          <span>Document Includes</span>
          <strong>Certified biometric capture</strong>
          <strong>Device verification certificate</strong>
          <strong>Print-ready record</strong>
        </div>
      </section>
    </div>
  );
}
