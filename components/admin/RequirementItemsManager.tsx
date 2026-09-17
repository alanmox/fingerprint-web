"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

type RequirementItem = {
  id: string;
  key: string;
  label: string;
  isActive: boolean;
};

export function RequirementItemsManager({
  initialItems,
}: {
  initialItems: RequirementItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/admin/requirement-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not add requirement.");
      }

      setItems((current) => [...current, payload.item]);
      setLabel("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not add requirement.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRetire(id: string) {
    setError("");

    const response = await fetch(`/api/admin/requirement-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });

    if (!response.ok) {
      setError("Could not retire requirement.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid">
      <div className="checklist">
        {items.map((item) => (
          <div className="checklist__item" key={item.id}>
            <label>{item.label}</label>
            <Button
              onClick={() => handleRetire(item.id)}
              type="button"
              variant="secondary"
            >
              Retire
            </Button>
          </div>
        ))}
        {items.length === 0 ? (
          <p className="status">No active requirements.</p>
        ) : null}
      </div>

      <form className="stack-inline" onSubmit={handleAdd}>
        <div className="field field--grow">
          <label htmlFor="requirement-label">New requirement</label>
          <input
            id="requirement-label"
            placeholder="e.g. Fee clearance confirmed"
            required
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </div>
        <Button busy={busy} type="submit">
          Add Requirement
        </Button>
      </form>
      <p className={`status ${error ? "status--error" : ""}`}>{error}</p>
    </div>
  );
}
