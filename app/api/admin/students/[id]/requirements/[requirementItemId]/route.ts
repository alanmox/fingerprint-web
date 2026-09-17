import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const patchSchema = z.object({
  isComplete: z.boolean(),
  notes: z.string().trim().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; requirementItemId: string }> },
) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, requirementItemId } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const studentRequirement = await db.studentRequirement.update({
    where: {
      studentId_requirementItemId: { studentId: id, requirementItemId },
    },
    data: {
      isComplete: parsed.data.isComplete,
      completedAt: parsed.data.isComplete ? new Date() : null,
      completedByAdminId: parsed.data.isComplete ? session.adminId : null,
      notes: parsed.data.notes,
    },
    include: { requirementItem: true },
  });

  return NextResponse.json({ studentRequirement });
}
