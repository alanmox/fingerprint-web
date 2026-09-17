import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { getDailySheet } from "@/lib/attendanceReports";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  const fieldSite = await db.fieldSite.findFirst();

  if (!fieldSite) {
    return NextResponse.json(
      { error: "No field site configured." },
      { status: 500 },
    );
  }

  const rows = await getDailySheet(fieldSite.id, new Date(date));

  const csv = toCsv(rows, [
    { header: "Student", value: (row) => row.student.fullName },
    {
      header: "Registration No.",
      value: (row) => row.student.registrationNumber,
    },
    {
      header: "Check-in",
      value: (row) =>
        row.record ? new Date(row.record.checkInAt).toLocaleTimeString() : "",
    },
    {
      header: "Check-out",
      value: (row) =>
        row.record?.checkOutAt
          ? new Date(row.record.checkOutAt).toLocaleTimeString()
          : "",
    },
    {
      header: "Status",
      value: (row) =>
        row.record
          ? row.record.checkOutAt
            ? "Complete"
            : "On site"
          : "Absent",
    },
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="attendance-${date}.csv"`,
    },
  });
}
