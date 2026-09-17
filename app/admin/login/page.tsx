"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "@/components/Form";
import { Button } from "@/components/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Login failed." }));
        throw new Error(payload.error ?? "Login failed.");
      }

      router.push("/admin/students");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <Form title="Admin Login" description="Sign in to manage student registration and field attendance.">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="stack-inline">
            <Button busy={busy} type="submit">
              Sign In
            </Button>
          </div>
          <p className={`status ${error ? "status--error" : ""}`}>{error}</p>
        </form>
      </Form>
    </div>
  );
}
