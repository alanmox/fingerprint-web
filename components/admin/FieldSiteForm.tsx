"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export type FieldSiteValues = {
  name: string;
  location: string;
  expectedStartMinutes: number;
  lateGraceMinutes: number;
  expectedWeekdays: number[];
};

export function FieldSiteForm({ initial }: { initial: FieldSiteValues }) {
  const [name, setName] = useState(initial.name);
  const [location, setLocation] = useState(initial.location);
  const [startTime, setStartTime] = useState(
    minutesToTime(initial.expectedStartMinutes),
  );
  const [graceMinutes, setGraceMinutes] = useState(
    String(initial.lateGraceMinutes),
  );
  const [weekdays, setWeekdays] = useState(new Set(initial.expectedWeekdays));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  function toggleWeekday(day: number) {
    setWeekdays((current) => {
      const next = new Set(current);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/admin/field-site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          location,
          expectedStartMinutes: timeToMinutes(startTime),
          lateGraceMinutes: Number(graceMinutes),
          expectedWeekdays: Array.from(weekdays).sort(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save field site.");
      }

      setStatus("Field site updated.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save field site.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="site-name">Name</label>
        <input
          id="site-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="site-location">Location</label>
        <input
          id="site-location"
          required
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="site-start">Expected start time</label>
        <input
          id="site-start"
          required
          type="time"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="site-grace">Late grace period (minutes)</label>
        <input
          id="site-grace"
          min={0}
          max={240}
          required
          type="number"
          value={graceMinutes}
          onChange={(event) => setGraceMinutes(event.target.value)}
        />
      </div>
      <div className="field field--grow">
        <label>Expected days</label>
        <div className="stack-inline">
          {WEEKDAY_LABELS.map((label, day) => (
            <label key={label} className="checklist__item">
              <input
                checked={weekdays.has(day)}
                onChange={() => toggleWeekday(day)}
                type="checkbox"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="stack-inline">
        <Button busy={busy} type="submit">
          Save Field Site
        </Button>
      </div>
      <p className={`status ${error ? "status--error" : "status--success"}`}>
        {error || status}
      </p>
    </form>
  );
}
