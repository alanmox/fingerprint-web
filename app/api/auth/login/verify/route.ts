import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { consumeAuthenticationChallenge, createSession } from "@/lib/auth";
import { base64URLToBuffer, getWebAuthnConfig, parseTransports } from "@/lib/webauthn";

type LoginVerifyRequest = {
  assertionResponse: Parameters<typeof verifyAuthenticationResponse>[0]["response"];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginVerifyRequest;
    const pendingChallenge = await consumeAuthenticationChallenge();

    if (!pendingChallenge) {
      return NextResponse.json(
        { error: "Login challenge expired. Please try again." },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { username: pendingChallenge.username },
      include: { authenticators: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const credentialID = base64URLToBuffer(body.assertionResponse.id);
    const authenticator = user.authenticators.find((item) =>
      Buffer.from(item.credentialID).equals(credentialID),
    );

    if (!authenticator) {
      return NextResponse.json({ error: "Authenticator not registered" }, { status: 404 });
    }

    const { origin, rpID } = getWebAuthnConfig();
    const verification = await verifyAuthenticationResponse({
      response: body.assertionResponse,
      expectedChallenge: pendingChallenge.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: body.assertionResponse.id,
        publicKey: Buffer.from(authenticator.publicKey),
        counter: authenticator.counter,
        transports: parseTransports(authenticator.transports),
      },
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json({ error: "Authentication verification failed" }, { status: 400 });
    }

    await db.authenticator.update({
      where: { id: authenticator.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
      },
    });

    await createSession(user.id, user.username);

    return NextResponse.json({ message: "Login successful" });
  } catch (error) {
    console.error("Failed to verify login", error);
    return NextResponse.json({ error: "Unable to verify login" }, { status: 500 });
  }
}
