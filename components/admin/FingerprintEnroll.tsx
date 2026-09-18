"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { DeviceStatus as DeviceStatusPanel, type DeviceState } from "@/components/DeviceStatus";

type ExistingTemplate = {
  quality: number;
  capturedAtIso: string;
  deviceSerial: string | null;
} | null;

export function FingerprintEnroll({
  studentId,
  existingTemplate,
}: {
  studentId: string;
  existingTemplate: ExistingTemplate;
}) {
  const [deviceStatus, setDeviceStatus] = useState<DeviceState>("idle");
  const [template, setTemplate] = useState(existingTemplate);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function checkDevice() {
    setBusy(true);
    setError("");
    setDeviceStatus("checking");
    setStatus("Looking for the Mantra MFS500 scanner service...");

    try {
      const response = await fetch("/api/fingerprint/device-info");
      const payload = await response.json();

      if (!payload.connected) {
        throw new Error(payload.error);
      }

      setDeviceStatus("ready");
      setStatus(
        `Scanner ready: ${payload.device.model} (serial ${payload.device.serial || "unknown"}).`,
      );
    } catch (caughtError) {
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

  async function enroll() {
    setBusy(true);
    setError("");
    setStatus("Ask the student to place their finger on the scanner...");

    try {
      const response = await fetch("/api/fingerprint/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const payload = await response.json();

      if (!payload.success) {
        throw new Error(payload.errInfo ?? "Enrollment failed.");
      }

      setTemplate({
        quality: payload.quality,
        capturedAtIso: payload.capturedAtIso,
        deviceSerial: payload.deviceSerial,
      });
      setStatus(`Fingerprint enrolled. Quality score ${payload.quality}/100.`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Enrollment failed.",
      );
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="device-panel">
        <DeviceStatusPanel state={deviceStatus} />
        <div className="stack-inline">
          <Button
            busy={busy && deviceStatus === "checking"}
            onClick={checkDevice}
            type="button"
            variant="secondary"
          >
            {deviceStatus === "ready" ? "Recheck Scanner" : "Connect Scanner"}
          </Button>
          <Button
            busy={busy && deviceStatus === "ready"}
            disabled={deviceStatus !== "ready"}
            onClick={enroll}
            type="button"
          >
            {template ? "Re-enroll Fingerprint" : "Enroll Fingerprint"}
          </Button>
        </div>
        <p className={`status ${error ? "status--error" : "status--success"}`}>
          {error || status}
        </p>
      </div>

      {template ? (
        <div className="quality-meter">
          <div className="quality-meter__label">Enrolled Template Quality</div>
          <div className="quality-meter__bar">
            <div
              style={{
                width: `${Math.min(100, Math.max(0, template.quality))}%`,
              }}
            />
          </div>
          <div className="quality-meter__value">
            {template.quality}/100 · captured{" "}
            {new Date(template.capturedAtIso).toLocaleString()}
          </div>
        </div>
      ) : (
        <p className="result-placeholder">No fingerprint enrolled yet.</p>
      )}
    </div>
  );
}
