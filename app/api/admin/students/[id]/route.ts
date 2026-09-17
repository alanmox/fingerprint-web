import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const student = await db.student.findUnique({
    where: { id },
    include: {
      fingerprintTemplate: true,
      requirements: { include: { requirementItem: true } },
      attendanceRecords: { orderBy: { date: "desc" }, take: 10 },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  return NextResponse.json({ student });
}

const patchSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  university: z.string().trim().min(2).optional(),
  program: z.string().trim().min(2).optional(),
  yearOfStudy: z.coerce.number().int().min(1).max(10).optional(),
  phone: z.string().trim().min(5).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the student details and try again." },
      { status: 400 },
    );
  }

  const { email, ...rest } = parsed.data;

  const student = await db.student.update({
    where: { id },
    data: {
      ...rest,
      ...(email !== undefined ? { email: email || null } : {}),
    },
  });

  return NextResponse.json({ student });
}
