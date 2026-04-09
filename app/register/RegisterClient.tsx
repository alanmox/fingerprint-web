"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/Button";
import { Form } from "@/components/Form";

type RegistrationOptionsJSON = Parameters<typeof startRegistration>[0]["optionsJSON"];

type RegisterOptionsResponse = {
  options: RegistrationOptionsJSON;
};

export function RegisterClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");

    try {
      const optionsResponse = await fetch("/api/auth/register/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const optionsData = (await optionsResponse.json()) as RegisterOptionsResponse & {
        error?: string;
      };

      if (!optionsResponse.ok) {
        throw new Error(optionsData.error ?? "Unable to create registration options");
      }

      const attestationResponse = await startRegistration({
        optionsJSON: optionsData.options,
      });

      const verificationResponse = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attestationResponse }),
      });

      const verificationData = (await verificationResponse.json()) as {
        error?: string;
        message?: string;
      };

      if (!verificationResponse.ok) {
        throw new Error(verificationData.error ?? "Registration verification failed");
      }

      setStatus(verificationData.message ?? "Passkey registered successfully");
      router.push("/login");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form
      title="Create Your Passkey"
      description="Register with your device biometrics or security key. No passwords required."
    >
      <form className="stack" onSubmit={handleRegister}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username"
            minLength={3}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <Button busy={busy} type="submit">
          Register
        </Button>
        <p className={`status ${error ? "status--error" : "status--success"}`}>
          {error || status}
        </p>
      </form>
    </Form>
  );
}
