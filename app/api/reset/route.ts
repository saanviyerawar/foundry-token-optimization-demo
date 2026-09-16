import { NextResponse } from "next/server";
import { resetData } from "@/lib/storage";
import { aggregateTelemetry } from "@/lib/telemetry";

export async function POST() {
  const data = await resetData();
  return NextResponse.json({ ...data, telemetry: aggregateTelemetry(data.requests) });
}
