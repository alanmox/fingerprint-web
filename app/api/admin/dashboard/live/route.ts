import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getDashboardSummary } from "@/lib/attendanceReports";

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fieldSite = await db.fieldSite.findFirst();

  if (!fieldSite) {
    return NextResponse.json(
      { error: "No field site is configured." },
      { status: 404 },
    );
  }

  const summary = await getDashboardSummary(fieldSite.id);

  return NextResponse.json(summary);
}
