import { NextResponse } from "next/server";
import { readData } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json((await readData()).traces);
}
