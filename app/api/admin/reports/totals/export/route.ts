import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getTotals } from "@/lib/attendanceReports";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const from =
    searchParams.get("from") ??
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const to = searchParams.get("to") ?? now.toISOString().slice(0, 10);

  const fieldSite = await db.fieldSite.findFirst();

  if (!fieldSite) {
    return NextResponse.json(
      { error: "No field site configured." },
      { status: 500 },
    );
  }

  const totals = await getTotals(fieldSite.id, new Date(from), new Date(to));

  const csv = toCsv(totals, [
    { header: "Student", value: (row) => row.studentName },
    { header: "Days Present", value: (row) => row.daysPresent },
    { header: "Total Hours", value: (row) => row.totalHours.toFixed(2) },
    { header: "Incomplete Days", value: (row) => row.incompleteDays },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="attendance-totals-${from}-to-${to}.csv"`,
    },
  });
}
