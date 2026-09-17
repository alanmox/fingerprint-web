import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const patchSchema = z.object({
  checkInAt: z.string().datetime().optional(),
  checkOutAt: z.string().datetime().nullable().optional(),
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
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const record = await db.attendanceRecord.update({
    where: { id },
    data: {
      ...(parsed.data.checkInAt
        ? { checkInAt: new Date(parsed.data.checkInAt) }
        : {}),
      ...(parsed.data.checkOutAt !== undefined
        ? {
            checkOutAt: parsed.data.checkOutAt
              ? new Date(parsed.data.checkOutAt)
              : null,
          }
        : {}),
    },
  });

  return NextResponse.json({ record });
}
