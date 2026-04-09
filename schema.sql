CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Authenticator" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "credentialID" BYTEA NOT NULL UNIQUE,
  "publicKey" BYTEA NOT NULL,
  "counter" INTEGER NOT NULL,
  "transports" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Authenticator_userId_idx" ON "Authenticator"("userId");

