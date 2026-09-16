import { NextResponse } from "next/server";
import { readData } from "@/lib/storage";
import { aggregateTelemetry } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await readData();
  return NextResponse.json({ ...data, telemetry: aggregateTelemetry(data.requests) });
}
