import type {
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";

type PublicKeyCredentialDescriptorJSON = {
  id: string;
  transports?: AuthenticatorTransportFuture[];
};

export function getWebAuthnConfig() {
  const rpName = process.env.NEXT_PUBLIC_RP_NAME;
  const rpID = process.env.NEXT_PUBLIC_RP_ID;
  const origin = process.env.ORIGIN;

  if (!rpName || !rpID || !origin) {
    throw new Error("Missing WebAuthn environment variables");
  }

  return { rpName, rpID, origin };
}

export function bufferToBase64URL(buffer: Uint8Array | Buffer) {
  return Buffer.from(buffer).toString("base64url");
}

export function base64URLToBuffer(value: string) {
  return Buffer.from(value, "base64url");
}

export function parseTransports(
  transports?: string | null,
): AuthenticatorTransportFuture[] {
  if (!transports) {
    return [];
  }

  return transports
    .split(",")
    .map((transport) => transport.trim())
    .filter(Boolean) as AuthenticatorTransportFuture[];
}

export function serializeTransports(
  transports?: AuthenticatorTransportFuture[] | string[] | null,
) {
  if (!transports?.length) {
    return null;
  }

  return transports.join(",");
}

export function toCredentialDescriptor(
  credentialID: Uint8Array | Buffer,
  transports?: string | null,
): PublicKeyCredentialDescriptorJSON {
  return {
    id: bufferToBase64URL(credentialID),
    transports: parseTransports(transports),
  };
}
