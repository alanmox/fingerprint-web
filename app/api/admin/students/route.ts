import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { ensureStudentRequirements } from "@/lib/requirements";

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  const students = await db.student.findMany({
    where: query
      ? {
          OR: [
            { fullName: { contains: query } },
            { registrationNumber: { contains: query } },
          ],
        }
      : undefined,
    include: {
      fingerprintTemplate: { select: { id: true } },
      requirements: { select: { isComplete: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ students });
}

const createSchema = z.object({
  fullName: z.string().trim().min(2),
  registrationNumber: z.string().trim().min(2),
  university: z.string().trim().min(2),
  program: z.string().trim().min(2),
  yearOfStudy: z.coerce.number().int().min(1).max(10),
  phone: z.string().trim().min(5),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the student details and try again." },
      { status: 400 },
    );
  }

  const fieldSite = await db.fieldSite.findFirst();

  if (!fieldSite) {
    return NextResponse.json(
      {
        error:
          "No field site is configured. Run the database seed script first.",
      },
      { status: 500 },
    );
  }

  const existing = await db.student.findUnique({
    where: { registrationNumber: parsed.data.registrationNumber },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A student with that registration number already exists." },
      { status: 409 },
    );
  }

  const student = await db.student.create({
    data: {
      fieldSiteId: fieldSite.id,
      fullName: parsed.data.fullName,
      registrationNumber: parsed.data.registrationNumber,
      university: parsed.data.university,
      program: parsed.data.program,
      yearOfStudy: parsed.data.yearOfStudy,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      createdByAdminId: session.adminId,
    },
  });

  await ensureStudentRequirements(student.id);

  return NextResponse.json({ student }, { status: 201 });
}
