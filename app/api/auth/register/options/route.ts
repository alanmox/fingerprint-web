import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { storeRegistrationChallenge } from "@/lib/auth";
import { getWebAuthnConfig } from "@/lib/webauthn";
import type { RegisterOptionsRequest } from "@/types/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterOptionsRequest;
    const username = body.username?.trim().toLowerCase();

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists. Login instead or choose another username." },
        { status: 409 },
      );
    }

    const { rpName, rpID } = getWebAuthnConfig();
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName: username,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    await storeRegistrationChallenge(options.challenge, username);

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Failed to create registration options", error);
    return NextResponse.json({ error: "Unable to create registration options" }, { status: 500 });
  }
}
