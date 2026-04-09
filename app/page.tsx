import Link from "next/link";

export default function HomePage() {
  return (
    <div className="grid">
      <section className="hero">
        <p className="eyebrow">ALLANTECH Biometric Imaging</p>
        <h1>Capture a thumb image with your phone camera.</h1>
        <p>
          This app requests camera permission, captures a close thumb photo, generates an
          enhanced scan preview, and places both panels into a printable ALLANTECH letter.
        </p>
        <div className="hero__actions">
          <Link className="button button--primary" href="/register">
            Start Capture
          </Link>
          <Link className="button button--secondary" href="/dashboard">
            Open Letter
          </Link>
        </div>
      </section>
    </div>
  );
}

