import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

async function hashPassword(plain) {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(plain, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

const prisma = new PrismaClient();

async function main() {
  const fieldSite = await prisma.fieldSite.upsert({
    where: { name: "Mloganzila Hospital" },
    update: {},
    create: {
      name: "Mloganzila Hospital",
      location: "Mloganzila, Dar es Salaam, Tanzania",
      expectedWeekdays: [1, 2, 3, 4, 5],
    },
  });

  await prisma.requirementItem.upsert({
    where: { key: "university_id_verified" },
    update: {},
    create: {
      key: "university_id_verified",
      label: "University ID / enrollment verified",
      sortOrder: 0,
    },
  });

  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn(
      "ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD not set — skipping bootstrap admin creation.",
    );
  } else {
    const normalizedEmail = adminEmail.toLowerCase();
    const passwordHash = await hashPassword(adminPassword);
    await prisma.admin.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        passwordHash,
        name: "Site Administrator",
      },
    });
  }

  console.log(`Seed complete. Field site: ${fieldSite.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
