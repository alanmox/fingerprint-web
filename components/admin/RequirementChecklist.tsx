"use client";

import { useState } from "react";

export type ChecklistRequirement = {
  requirementItemId: string;
  label: string;
  isComplete: boolean;
};

export function RequirementChecklist({
  studentId,
  initialRequirements,
}: {
  studentId: string;
  initialRequirements: ChecklistRequirement[];
}) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [error, setError] = useState("");

  async function toggle(requirementItemId: string, isComplete: boolean) {
    setError("");
    setRequirements((current) =>
      current.map((requirement) =>
        requirement.requirementItemId === requirementItemId
          ? { ...requirement, isComplete }
          : requirement,
      ),
    );

    const response = await fetch(
      `/api/admin/students/${studentId}/requirements/${requirementItemId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isComplete }),
      },
    );

    if (!response.ok) {
      setError("Could not update requirement. Reverting.");
      setRequirements((current) =>
        current.map((requirement) =>
          requirement.requirementItemId === requirementItemId
            ? { ...requirement, isComplete: !isComplete }
            : requirement,
        ),
      );
    }
  }

  return (
    <div className="checklist">
      {requirements.map((requirement) => (
        <div className="checklist__item" key={requirement.requirementItemId}>
          <input
            checked={requirement.isComplete}
            id={`req-${requirement.requirementItemId}`}
            onChange={(event) =>
              toggle(requirement.requirementItemId, event.target.checked)
            }
            type="checkbox"
          />
          <label htmlFor={`req-${requirement.requirementItemId}`}>
            {requirement.label}
          </label>
        </div>
      ))}
      {requirements.length === 0 ? (
        <p className="status">No requirements configured.</p>
      ) : null}
      <p className={`status ${error ? "status--error" : ""}`}>{error}</p>
    </div>
  );
}
