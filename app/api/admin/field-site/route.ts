import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

const patchSchema = z.object({
  name: z.string().trim().min(2).optional(),
  location: z.string().trim().min(2).optional(),
  expectedStartMinutes: z.coerce.number().int().min(0).max(1439).optional(),
  lateGraceMinutes: z.coerce.number().int().min(0).max(240).optional(),
  expectedWeekdays: z.array(z.number().int().min(0).max(6)).optional(),
});

export async function PATCH(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the field site details and try again." },
      { status: 400 },
    );
  }

  const existing = await db.fieldSite.findFirst();

  if (!existing) {
    return NextResponse.json(
      { error: "No field site is configured." },
      { status: 404 },
    );
  }

  const fieldSite = await db.fieldSite.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  return NextResponse.json({ fieldSite });
}
