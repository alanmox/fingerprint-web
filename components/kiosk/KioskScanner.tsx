"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FingerprintIcon } from "@/components/icons";
import { DeviceStatus, type DeviceState } from "@/components/DeviceStatus";
import { StudentIdentity } from "@/components/StudentIdentity";
import {
  ScanStatus,
  SCAN_OUTCOME_CONFIG,
  type ScanOutcomeState,
} from "@/components/ScanStatus";

const DEVICE_POLL_MS = 20000;
const SCAN_COOLDOWN_MS = 600;
const RESULT_TIMEOUT_MS = 6000;

type ScanOutcome = {
  state: ScanOutcomeState;
  studentName?: string;
  timestamp?: string;
  reasons?: string[];
  detail?: string;
};

type ScanApiPayload = {
  outcome?: "matched" | "no_match" | "ineligible" | "device_error";
  action?: "check-in" | "check-out" | "already-complete";
  studentName?: string;
  timestamp?: string;
  reasons?: string[];
  message?: string;
};

export function KioskScanner({ fieldSiteName }: { fieldSiteName?: string }) {
  const [deviceState, setDeviceState] = useState<DeviceState>("idle");
  const [deviceDetail, setDeviceDetail] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const scanningRef = useRef(false);

  const checkDevice = useCallback(async () => {
    if (scanningRef.current) {
      return;
    }

    setDeviceState((current) => (current === "ready" ? current : "checking"));

    try {
      const response = await fetch("/api/fingerprint/device-info");
      const payload = await response.json();

      if (!payload.connected) {
        throw new Error(payload.error ?? "Scanner unavailable.");
      }

      setDeviceState("ready");
      setDeviceDetail(
        `${payload.device?.model ?? "Mantra scanner"} · serial ${payload.device?.serial ?? "unknown"}`,
      );
    } catch (caughtError) {
      setDeviceState("error");
      setDeviceDetail(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to reach the fingerprint scanner service.",
      );
    }
  }, []);

  useEffect(() => {
    checkDevice();
    const interval = setInterval(checkDevice, DEVICE_POLL_MS);
    return () => clearInterval(interval);
  }, [checkDevice]);

  async function handleScan() {
    if (scanning || deviceState !== "ready") {
      return;
    }

    scanningRef.current = true;
    setScanning(true);
    setOutcome(null);

    try {
      const response = await fetch("/api/kiosk/scan", { method: "POST" });
      const payload: ScanApiPayload = await response.json();

      if (payload.outcome === "matched") {
        setOutcome({
          state:
            payload.action === "already-complete"
              ? "already-complete"
              : "matched-success",
          studentName: payload.studentName,
          timestamp: payload.timestamp,
          detail:
            payload.action === "check-in"
              ? "Checked in"
              : payload.action === "check-out"
                ? "Checked out"
                : "Already recorded today",
        });
      } else if (payload.outcome === "ineligible") {
        setOutcome({
          state: "ineligible",
          studentName: payload.studentName,
          reasons: payload.reasons,
        });
      } else if (payload.outcome === "no_match") {
        setOutcome({ state: "unknown-fingerprint" });
      } else if (payload.outcome === "device_error") {
        setOutcome({
          state: payload.message?.includes("field site")
            ? "config-error"
            : "device-error",
          detail: payload.message,
        });
      } else {
        setOutcome({ state: "device-error", detail: "Scan failed." });
      }
    } catch {
      setOutcome({
        state: "network-error",
        detail: "Could not reach the attendance system.",
      });
    } finally {
      window.setTimeout(() => {
        scanningRef.current = false;
        setScanning(false);
      }, SCAN_COOLDOWN_MS);
      window.setTimeout(() => setOutcome(null), RESULT_TIMEOUT_MS);
    }
  }

  const orbTone = scanning
    ? "scanning"
    : deviceState !== "ready"
      ? "idle"
      : outcome
        ? SCAN_OUTCOME_CONFIG[outcome.state].tone
        : "ready";

  const instruction =
    deviceState !== "ready"
      ? deviceState === "checking"
        ? "Connecting to the scanner..."
        : "Scanner offline — attendance cannot be recorded right now."
      : scanning
        ? "Reading fingerprint..."
        : outcome
          ? "Ready for the next student."
          : "Place your finger on the scanner and press the button below.";

  return (
    <div className="scan-station">
      <div className="scan-station__frame">
        <div className="scan-station__header">
          <div className="scan-station__site">
            <span>Field Site</span>
            <strong>{fieldSiteName ?? "Not configured"}</strong>
          </div>
          <DeviceStatus
            state={deviceState}
            detail={deviceState === "error" ? deviceDetail : undefined}
          />
        </div>

        <div className="scan-station__stage">
          <h1>Scan Station</h1>
          <button
            className={`scan-orb scan-orb--${orbTone}`}
            disabled={scanning || deviceState !== "ready"}
            onClick={handleScan}
            type="button"
            aria-label="Scan fingerprint"
          >
            <FingerprintIcon size={64} />
          </button>
          <p className="scan-station__instruction">{instruction}</p>
        </div>

        {outcome ? (
          <div
            className={`scan-result scan-result--${SCAN_OUTCOME_CONFIG[outcome.state].tone}`}
          >
            <ScanStatus state={outcome.state} />
            {outcome.studentName ? (
              <StudentIdentity
                fullName={outcome.studentName}
                subtitle={outcome.detail}
              />
            ) : outcome.detail ? (
              <p>{outcome.detail}</p>
            ) : null}
            {outcome.reasons && outcome.reasons.length > 0 ? (
              <ul className="scan-result__reasons">
                {outcome.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
            {outcome.timestamp ? (
              <span className="scan-result__time">
                {new Date(outcome.timestamp).toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
