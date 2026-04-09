"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/Button";
import { Form } from "@/components/Form";

type AuthenticationOptionsJSON = Parameters<typeof startAuthentication>[0]["optionsJSON"];

type LoginOptionsResponse = {
  options: AuthenticationOptionsJSON;
};

export function LoginClient() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");

    try {
      const optionsResponse = await fetch("/api/auth/login/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const optionsData = (await optionsResponse.json()) as LoginOptionsResponse & {
        error?: string;
      };

      if (!optionsResponse.ok) {
        throw new Error(optionsData.error ?? "Unable to create authentication options");
      }

      const assertionResponse = await startAuthentication({
        optionsJSON: optionsData.options,
      });

      const verificationResponse = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assertionResponse }),
      });

      const verificationData = (await verificationResponse.json()) as {
        error?: string;
        message?: string;
      };

      if (!verificationResponse.ok) {
        throw new Error(verificationData.error ?? "Login verification failed");
      }

      setStatus(verificationData.message ?? "Signed in");
      router.push("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Form
      title="Login With Your Passkey"
      description="Authenticate using Touch ID, Face ID, Windows Hello, or a hardware security key."
    >
      <form className="stack" onSubmit={handleLogin}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            autoComplete="username webauthn"
            minLength={3}
            required
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>
        <Button busy={busy} type="submit">
          Login
        </Button>
        <p className={`status ${error ? "status--error" : "status--success"}`}>
          {error || status}
        </p>
      </form>
    </Form>
  );
}
