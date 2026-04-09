import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { consumeRegistrationChallenge } from "@/lib/auth";
import {
  base64URLToBuffer,
  getWebAuthnConfig,
  serializeTransports,
} from "@/lib/webauthn";

type RegisterVerifyRequest = {
  attestationResponse: Parameters<typeof verifyRegistrationResponse>[0]["response"];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterVerifyRequest;
    const pendingChallenge = await consumeRegistrationChallenge();

    if (!pendingChallenge) {
      return NextResponse.json(
        { error: "Registration challenge expired. Please try again." },
        { status: 400 },
      );
    }

    const { origin, rpID } = getWebAuthnConfig();

    const verification = await verifyRegistrationResponse({
      response: body.attestationResponse,
      expectedChallenge: pendingChallenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Registration verification failed" }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { username: pendingChallenge.username },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;
    const credentialID =
      typeof credential.id === "string"
        ? base64URLToBuffer(credential.id)
        : Buffer.from(credential.id);

    const user = await db.user.create({
      data: {
        username: pendingChallenge.username,
        authenticators: {
          create: {
            credentialID,
            publicKey: Buffer.from(credential.publicKey),
            counter: credential.counter,
            transports: serializeTransports(body.attestationResponse.response.transports),
          },
        },
      },
    });

    return NextResponse.json({
      message: `Passkey registered for ${user.username}`,
      credentialDeviceType,
      credentialBackedUp,
    });
  } catch (error) {
    console.error("Failed to verify registration", error);
    return NextResponse.json({ error: "Unable to verify registration" }, { status: 500 });
  }
}
