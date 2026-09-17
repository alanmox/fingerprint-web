"use client";

import { useState } from "react";

type ScanResult = {
  kind: "success" | "error";
  message: string;
};

export function KioskScanner() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function handleScan() {
    setBusy(true);
    setResult(null);

    try {
      const response = await fetch("/api/kiosk/scan", { method: "POST" });
      const payload = await response.json();

      if (payload.outcome === "matched") {
        const verb =
          payload.action === "check-in"
            ? "Checked in"
            : payload.action === "check-out"
              ? "Checked out"
              : "Already recorded";
        setResult({
          kind: "success",
          message: `${verb}: ${payload.studentName} at ${new Date(payload.timestamp).toLocaleTimeString()}`,
        });
      } else {
        setResult({
          kind: "error",
          message: payload.message ?? "Scan failed.",
        });
      }
    } catch {
      setResult({
        kind: "error",
        message: "Could not reach the attendance system.",
      });
    } finally {
      setBusy(false);
      setTimeout(() => setResult(null), 4000);
    }
  }

  return (
    <div className="kiosk-shell">
      <div className="kiosk-card">
        <h1>Mloganzila Hospital Field Attendance</h1>
        <p>Place your finger on the scanner and press the button below.</p>
        <button
          className="kiosk-button"
          disabled={busy}
          onClick={handleScan}
          type="button"
        >
          {busy ? "Scanning..." : "Scan Fingerprint"}
        </button>
        {result ? (
          <div
            className={`kiosk-result kiosk-result--${result.kind === "success" ? "success" : "error"}`}
          >
            {result.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
