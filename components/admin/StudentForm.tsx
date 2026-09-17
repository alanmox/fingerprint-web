"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

export type StudentFormValues = {
  fullName: string;
  registrationNumber: string;
  university: string;
  program: string;
  yearOfStudy: string;
  phone: string;
  email: string;
};

const EMPTY_VALUES: StudentFormValues = {
  fullName: "",
  registrationNumber: "",
  university: "",
  program: "",
  yearOfStudy: "1",
  phone: "",
  email: "",
};

type Props = {
  initialValues?: Partial<StudentFormValues>;
  lockRegistrationNumber?: boolean;
  submitLabel: string;
  onSubmit: (values: StudentFormValues) => Promise<void>;
};

export function StudentForm({
  initialValues,
  lockRegistrationNumber,
  submitLabel,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<StudentFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof StudentFormValues>(
    key: K,
    value: StudentFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      await onSubmit(values);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save student.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          required
          value={values.fullName}
          onChange={(event) => update("fullName", event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="registrationNumber">Registration Number</label>
        <input
          id="registrationNumber"
          disabled={lockRegistrationNumber}
          required
          value={values.registrationNumber}
          onChange={(event) => update("registrationNumber", event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="university">University</label>
        <input
          id="university"
          required
          value={values.university}
          onChange={(event) => update("university", event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="program">Program</label>
        <input
          id="program"
          required
          value={values.program}
          onChange={(event) => update("program", event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="yearOfStudy">Year of Study</label>
        <input
          id="yearOfStudy"
          min={1}
          max={10}
          required
          type="number"
          value={values.yearOfStudy}
          onChange={(event) => update("yearOfStudy", event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input
          id="phone"
          required
          value={values.phone}
          onChange={(event) => update("phone", event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="email">Email (optional)</label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
        />
      </div>

      <div className="stack-inline">
        <Button busy={busy} type="submit">
          {submitLabel}
        </Button>
      </div>
      <p className={`status ${error ? "status--error" : ""}`}>{error}</p>
    </form>
  );
}
