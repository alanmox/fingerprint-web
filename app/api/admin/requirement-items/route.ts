import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { ensureRequirementCoverage } from "@/lib/requirements";

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.requirementItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json({ items });
}

const createSchema = z.object({
  label: z.string().trim().min(2),
});

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "A requirement label is required." }, { status: 400 });
  }

  const key = slugify(parsed.data.label);

  if (!key) {
    return NextResponse.json({ error: "A requirement label is required." }, { status: 400 });
  }

  const existing = await db.requirementItem.findUnique({ where: { key } });

  if (existing) {
    return NextResponse.json(
      { error: "A requirement with that name already exists." },
      { status: 409 },
    );
  }

  const maxSortOrder = await db.requirementItem.aggregate({ _max: { sortOrder: true } });

  const item = await db.requirementItem.create({
    data: {
      key,
      label: parsed.data.label,
      sortOrder: (maxSortOrder._max.sortOrder ?? 0) + 1,
    },
  });

  await ensureRequirementCoverage(item.id);

  return NextResponse.json({ item }, { status: 201 });
}
