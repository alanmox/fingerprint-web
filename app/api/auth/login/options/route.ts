import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { storeAuthenticationChallenge } from "@/lib/auth";
import { getWebAuthnConfig, toCredentialDescriptor } from "@/lib/webauthn";
import type { LoginOptionsRequest } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginOptionsRequest;
    const username = body.username?.trim().toLowerCase();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { username },
      include: { authenticators: true },
    });

    if (!user || user.authenticators.length === 0) {
      return NextResponse.json(
        { error: "No passkey found for this username. Register first." },
        { status: 404 },
      );
    }

    const { rpID } = getWebAuthnConfig();
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: user.authenticators.map((authenticator) =>
        toCredentialDescriptor(authenticator.credentialID, authenticator.transports),
      ),
      userVerification: "preferred",
    });

    await storeAuthenticationChallenge(options.challenge, username);

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Failed to create authentication options", error);
    return NextResponse.json(
      { error: "Unable to create authentication options" },
      { status: 500 },
    );
  }
}

