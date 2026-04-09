import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "amx_session";
const REGISTRATION_COOKIE = "amx_registration";
const AUTHENTICATION_COOKIE = "amx_authentication";

type SessionPayload = {
  userId: string;
  username: string;
  exp: number;
};

type ChallengePayload = {
  challenge: string;
  username: string;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is missing");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function encode<T>(payload: T) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode<T>(token: string): T | null {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return null;
  }

  const expectedSignature = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, username: string) {
  const cookieStore = await cookies();
  const payload: SessionPayload = {
    userId,
    username,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };

  cookieStore.set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = decode<SessionPayload>(token);

  if (!payload || payload.exp < Date.now()) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return payload;
}

async function setChallengeCookie(name: string, payload: ChallengePayload) {
  const cookieStore = await cookies();
  cookieStore.set(name, encode(payload), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 5,
  });
}

async function getChallengeCookie(name: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(name)?.value;

  if (!token) {
    return null;
  }

  const payload = decode<ChallengePayload>(token);

  if (!payload || payload.expiresAt < Date.now()) {
    cookieStore.delete(name);
    return null;
  }

  return payload;
}

async function clearChallengeCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

export async function storeRegistrationChallenge(challenge: string, username: string) {
  await setChallengeCookie(REGISTRATION_COOKIE, {
    challenge,
    username,
    expiresAt: Date.now() + 1000 * 60 * 5,
  });
}

export async function consumeRegistrationChallenge() {
  const payload = await getChallengeCookie(REGISTRATION_COOKIE);
  await clearChallengeCookie(REGISTRATION_COOKIE);
  return payload;
}

export async function storeAuthenticationChallenge(challenge: string, username: string) {
  await setChallengeCookie(AUTHENTICATION_COOKIE, {
    challenge,
    username,
    expiresAt: Date.now() + 1000 * 60 * 5,
  });
}

export async function consumeAuthenticationChallenge() {
  const payload = await getChallengeCookie(AUTHENTICATION_COOKIE);
  await clearChallengeCookie(AUTHENTICATION_COOKIE);
  return payload;
}

