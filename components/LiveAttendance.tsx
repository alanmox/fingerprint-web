"use client";

import { useEffect, useRef, useState } from "react";
import { StudentIdentity } from "@/components/StudentIdentity";
import { ScanStatus, type ScanOutcomeState } from "@/components/ScanStatus";

const POLL_MS = 10000;

export type RecentAttempt = {
  id: string;
  outcome: string;
  matchedStudentName: string | null;
  matchScore: number | null;
  createdAt: string;
};

export type DashboardLivePayload = {
  present: number;
  checkedOut: number;
  late: number;
  absent: number;
  failedToday: number;
  lastScanAt: string | null;
  recentAttempts: RecentAttempt[];
};

function attemptToOutcomeState(outcome: string): ScanOutcomeState {
  switch (outcome) {
    case "matched":
      return "matched-success";
    case "ineligible":
      return "ineligible";
    case "device_error":
      return "device-error";
    default:
      return "unknown-fingerprint";
  }
}

function formatRelativeTime(iso: string | null) {
  if (!iso) {
    return "No scans yet";
  }

  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function LiveAttendance({
  initial,
}: {
  initial: DashboardLivePayload;
}) {
  const [data, setData] = useState<DashboardLivePayload>(initial);
  const inFlight = useRef(false);

  useEffect(() => {
    async function poll() {
      if (inFlight.current || document.hidden) {
        return;
      }

      inFlight.current = true;

      try {
        const response = await fetch("/api/admin/dashboard/live");

        if (response.ok) {
          const payload = await response.json();
          setData(payload);
        }
      } catch {
        // Keep showing the last known data; the next poll will retry.
      } finally {
        inFlight.current = false;
      }
    }

    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="card">
      <div className="card__header">
        <p className="eyebrow">Live Attendance</p>
        <h2>Recent Scans</h2>
        <p>
          Last scan: {formatRelativeTime(data.lastScanAt)} · {data.failedToday}{" "}
          failed attempt{data.failedToday === 1 ? "" : "s"} today
        </p>
      </div>
      <div className="live-feed">
        {data.recentAttempts.map((attempt) => (
          <div className="live-feed__row" key={attempt.id}>
            {attempt.matchedStudentName ? (
              <StudentIdentity
                fullName={attempt.matchedStudentName}
                size="sm"
              />
            ) : (
              <ScanStatus state={attemptToOutcomeState(attempt.outcome)} />
            )}
            <span className="live-feed__time">
              {new Date(attempt.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {data.recentAttempts.length === 0 ? (
          <p className="status">No scan attempts recorded yet.</p>
        ) : null}
      </div>
    </section>
  );
}
