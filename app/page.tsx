import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid">
      <section className="hero hero--station">
        <div className="station-copy">
          <p className="eyebrow">ALLANTECH Organization</p>
          <h1>Official Thumb Impression Capture</h1>
          <p>
            Securely capture your thumb impression and generate a professional document 
            suitable for official records. All processing is done securely within your browser.
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
          <strong>Secure capture</strong>
          <strong>Professional impression</strong>
          <strong>Print-ready record</strong>
        </div>
      </section>
    </div>
  );
}
