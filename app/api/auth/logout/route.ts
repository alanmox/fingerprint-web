import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function POST() {
  await clearSession();
  return NextResponse.redirect(
    new URL("/login", process.env.ORIGIN ?? "http://localhost:3000"),
    303,
  );
}
