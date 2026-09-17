"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";

const STORAGE_KEY = "allantech-fingerprint-record";

type CaptureRecord = {
  errCode: string;
  qualityScore: number;
  capturedAtIso: string;
  deviceModel: string;
  deviceSerial: string;
  rdsId: string;
  rdsVer: string;
  pidDataHash: string;
};

type FingerprintRecord = {
  applicantName: string;
  purpose: string;
  documentRef: string;
  issuedBy: string;
  capturedAt: string;
  capture: CaptureRecord | null;
};

type Props = {
  mode?: "capture" | "letter";
};

type DeviceStatus = "idle" | "checking" | "ready" | "error";

type DeviceInfo = {
  dpId: string;
  rdsId: string;
  rdsVer: string;
  mi: string;
  mc: string;
  serial: string;
  model: string;
};

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function deviceStatusLabel(status: DeviceStatus) {
  switch (status) {
    case "checking":
      return "Checking scanner...";
    case "ready":
      return "Scanner connected";
    case "error":
      return "Scanner unavailable";
    default:
      return "Scanner not connected";
  }
}

export function FingerprintStudio({ mode = "capture" }: Props) {
  const [applicantName, setApplicantName] = useState("");
  const [purpose, setPurpose] = useState("Thumb verification request");
  const [documentRef, setDocumentRef] = useState("");
  const [issuedBy, setIssuedBy] = useState("ALLANTECH Biometric Desk");
  const [capturedAt, setCapturedAt] = useState(getTodayValue());
  const [capture, setCapture] = useState<CaptureRecord | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>("idle");
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved) as FingerprintRecord;
      setApplicantName(parsed.applicantName);
      setPurpose(parsed.purpose);
      setDocumentRef(parsed.documentRef);
      setIssuedBy(parsed.issuedBy);
      setCapturedAt(parsed.capturedAt);
      setCapture(parsed.capture ?? null);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function saveRecord(record: FingerprintRecord) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }

  function persist(nextCapture: CaptureRecord | null) {
    saveRecord({
      applicantName,
      purpose,
      documentRef,
      issuedBy,
      capturedAt,
      capture: nextCapture,
    });
  }

  async function checkDevice() {
    setBusy(true);
    setError("");
    setDeviceStatus("checking");
    setStatus("Looking for the Mantra MFS500 scanner service...");

    try {
      const response = await fetch("/api/fingerprint/device-info");
      const payload = (await response.json()) as
        | { connected: true; device: DeviceInfo }
        | { connected: false; error: string };

      if (!payload.connected) {
        throw new Error(payload.error);
      }

      setDeviceInfo(payload.device);
      setDeviceStatus("ready");
      setStatus(
        `Scanner ready: ${payload.device.model} (serial ${payload.device.serial || "unknown"}).`,
      );
    } catch (caughtError) {
      setDeviceInfo(null);
      setDeviceStatus("error");
      setStatus("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to reach the fingerprint scanner service.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCapture() {
    setBusy(true);
    setError("");
    setStatus("Place the applicant's thumb on the scanner...");

    try {
      const response = await fetch("/api/fingerprint/capture", {
        method: "POST",
      });
      const payload = await response.json();

      if (!payload.success) {
        throw new Error(payload.errInfo || "Fingerprint capture failed.");
      }

      const record: CaptureRecord = {
        errCode: payload.errCode,
        qualityScore: payload.qualityScore,
        capturedAtIso: payload.capturedAtIso,
        deviceModel: payload.device.model,
        deviceSerial: payload.device.serial,
        rdsId: payload.device.rdsId,
        rdsVer: payload.device.rdsVer,
        pidDataHash: payload.pidDataHash,
      };

      setCapture(record);
      persist(record);
      setStatus(
        `Fingerprint captured. Quality score ${record.qualityScore}/100.`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Fingerprint capture failed.",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "letter") {
    return (
      <div className="grid">
        <section className="card letter-shell">
          <div className="card__header letter-actions">
            <Button onClick={() => window.print()} type="button">
              Print Official Letter
            </Button>
            <Link className="button button--secondary" href="/register">
              Return to Capture
            </Link>
          </div>

          <article className="letter" id="print-letter">
            <header className="letter__header">
              <div>
                <p className="letter__brand">ALLANTECH ORGANIZATION</p>
                <h2>Official Fingerprint Capture Record</h2>
              </div>
              <div className="letter__meta">
                <span>Date: {capturedAt || getTodayValue()}</span>
                <span>Reference: {documentRef || "—"}</span>
              </div>
            </header>

            <div className="letter__body">
              <p className="letter__salutation">To whom it may concern,</p>
              <p className="letter__statement">
                This document certifies that{" "}
                <strong>{applicantName || "—"}</strong> has completed a verified
                fingerprint capture for{" "}
                <strong>{purpose || "official verification"}</strong>.
              </p>
              <p className="letter__method">
                The fingerprint was captured using a UIDAI-compliant Mantra
                MFS500 biometric scanner. The certificate below is the
                device&apos;s digital proof of capture, not a photograph, in
                line with biometric data protection requirements.
              </p>

              <div className="letter__impression-section">
                <div className="certificate-block">
                  <div className="certificate-label">
                    Biometric Capture Certificate
                  </div>
                  {capture ? (
                    <>
                      <div className="certificate-status certificate-status--verified">
                        VERIFIED
                      </div>
                      <div className="certificate-grid">
                        <div className="certificate-row">
                          <span>Device</span>
                          <strong>{capture.deviceModel}</strong>
                        </div>
                        <div className="certificate-row">
                          <span>Serial No.</span>
                          <strong>{capture.deviceSerial || "—"}</strong>
                        </div>
                        <div className="certificate-row">
                          <span>Quality Score</span>
                          <strong>{capture.qualityScore}/100</strong>
                        </div>
                        <div className="certificate-row">
                          <span>Captured At</span>
                          <strong>
                            {new Date(capture.capturedAtIso).toLocaleString()}
                          </strong>
                        </div>
                        <div className="certificate-row certificate-row--hash">
                          <span>PID Data Hash (SHA-256)</span>
                          <code>{capture.pidDataHash}</code>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="certificate-placeholder">
                      <span>Fingerprint not yet captured</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="letter__footer">
                <div className="letter__details">
                  <div className="detail-row">
                    <span className="detail-label">Applicant:</span>
                    <span className="detail-value">{applicantName || "—"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Reference Number:</span>
                    <span className="detail-value">{documentRef || "—"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Date of Capture:</span>
                    <span className="detail-value">
                      {capturedAt || getTodayValue()}
                    </span>
                  </div>
                </div>

                <div className="letter__authorization">
                  <div className="auth-row">
                    <span className="auth-label">Authorized by:</span>
                    <span className="auth-value">
                      {issuedBy || "ALLANTECH Biometric Desk"}
                    </span>
                  </div>
                  <div className="signature-line">
                    <span className="signature-label">Signature:</span>
                    <div className="signature-space"></div>
                  </div>
                  <div className="stamp-area">
                    <div className="official-stamp">
                      <span>OFFICIAL</span>
                      <small>ALLANTECH</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="grid capture-layout">
      <section className="hero hero--compact">
        <p className="eyebrow">ALLANTECH Organization</p>
        <h1>Fingerprint Capture</h1>
        <p>
          Connect the Mantra MFS500 scanner, place the applicant&apos;s thumb on
          the sensor, and capture a verified fingerprint for the official
          record.
        </p>
        <div className="hero__actions">
          <Button
            busy={busy && deviceStatus === "checking"}
            onClick={checkDevice}
            type="button"
          >
            Connect Scanner
          </Button>
          <Link className="button button--secondary" href="/dashboard">
            View Document
          </Link>
        </div>
      </section>

      <section className="card studio">
        <div className="card__header">
          <p className="eyebrow">Capture Details</p>
          <h2>Record Information</h2>
          <p>
            Complete the information below before capturing the fingerprint. All
            fields marked are required for your official document.
          </p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="applicantName">Applicant Name</label>
            <input
              id="applicantName"
              required
              value={applicantName}
              onChange={(event) => setApplicantName(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="documentRef">Document Reference</label>
            <input
              id="documentRef"
              value={documentRef}
              onChange={(event) => setDocumentRef(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="purpose">Purpose</label>
            <input
              id="purpose"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="issuedBy">Issued By</label>
            <input
              id="issuedBy"
              value={issuedBy}
              onChange={(event) => setIssuedBy(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="capturedAt">Capture Date</label>
            <input
              id="capturedAt"
              type="date"
              value={capturedAt}
              onChange={(event) => setCapturedAt(event.target.value)}
            />
          </div>
        </div>

        <div className="studio__preview">
          <div className="intake-strip">
            <div>
              <span>Step 1</span>
              <strong>Connect scanner</strong>
            </div>
            <div>
              <span>Step 2</span>
              <strong>Place thumb on sensor</strong>
            </div>
            <div>
              <span>Step 3</span>
              <strong>Generate document</strong>
            </div>
          </div>

          <div className="device-panel">
            <div className={`device-status device-status--${deviceStatus}`}>
              <span className="device-status__dot" />
              <div>
                <strong>{deviceStatusLabel(deviceStatus)}</strong>
                {deviceInfo ? (
                  <p>
                    {deviceInfo.model} · Serial {deviceInfo.serial || "unknown"}
                  </p>
                ) : (
                  <p>
                    Click &quot;Connect Scanner&quot; to detect the Mantra
                    MFS500.
                  </p>
                )}
              </div>
            </div>

            <div className="stack-inline">
              <Button
                busy={busy && deviceStatus === "checking"}
                onClick={checkDevice}
                type="button"
                variant="secondary"
              >
                {deviceStatus === "ready"
                  ? "Recheck Scanner"
                  : "Connect Scanner"}
              </Button>
              <Button
                busy={busy && deviceStatus === "ready"}
                disabled={deviceStatus !== "ready"}
                onClick={handleCapture}
                type="button"
              >
                Capture Fingerprint
              </Button>
            </div>
          </div>

          <p
            className={`status ${error ? "status--error" : "status--success"}`}
          >
            {error || status}
          </p>
          {error ? (
            <div className="help-card">
              <p>
                Confirm the Mantra RD Service is installed and running on this
                computer, the MFS500 is plugged in, and this app is running on
                the same machine as the scanner. Remote hosting (e.g. Render)
                cannot reach a scanner on your local network.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="card results">
        <div className="card__header">
          <p className="eyebrow">Preview</p>
          <h2>Capture Result</h2>
          <p>
            Review the capture certificate below. Once satisfied, proceed to
            generate your official document for printing.
          </p>
        </div>

        <div className="results__grid">
          {capture ? (
            <div className="capture-summary">
              <div className="quality-meter">
                <div className="quality-meter__label">Scan Quality</div>
                <div className="quality-meter__bar">
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, capture.qualityScore))}%`,
                    }}
                  />
                </div>
                <div className="quality-meter__value">
                  {capture.qualityScore}/100
                </div>
              </div>
              <dl className="capture-details">
                <div>
                  <dt>Device</dt>
                  <dd>{capture.deviceModel}</dd>
                </div>
                <div>
                  <dt>Serial</dt>
                  <dd>{capture.deviceSerial || "—"}</dd>
                </div>
                <div>
                  <dt>RD Service</dt>
                  <dd>
                    {capture.rdsId || "—"}{" "}
                    {capture.rdsVer ? `v${capture.rdsVer}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Captured</dt>
                  <dd>{new Date(capture.capturedAtIso).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>PID Hash</dt>
                  <dd className="capture-hash">{capture.pidDataHash}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="result-placeholder">
              Connect the scanner and capture a fingerprint to see the result
            </div>
          )}
        </div>

        <div className="stack-inline">
          <Link className="button button--primary" href="/dashboard">
            Generate Official Document
          </Link>
        </div>
      </section>
    </div>
  );
}
