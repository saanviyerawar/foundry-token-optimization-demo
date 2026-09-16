import { NextRequest, NextResponse } from "next/server";
import { createRequest } from "@/lib/routing";
import { makeTrace } from "@/lib/seed-data";
import { readData, updateData } from "@/lib/storage";
import { aggregateTelemetry } from "@/lib/telemetry";
import type { RouteRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await readData();
  return NextResponse.json(aggregateTelemetry(data.requests));
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { count?: unknown };
  const count = Math.min(100, Math.max(1, Number(body.count ?? 20)));
  const prompts = [
    "Classify a customer issue.",
    "Retrieve the approval policy.",
    "Use CRM tools to update a milestone.",
    "Analyze architecture trade-offs for the agent platform.",
  ];
  const priorities: RouteRequest["priority"][] = ["cost", "latency", "balanced", "quality"];
  const data = await updateData((current) => {
    const generated = Array.from({ length: count }, (_, index) =>
      createRequest(prompts[index % prompts.length], priorities[index % priorities.length], Date.now() + index),
    );
    current.requests.push(...generated);
    current.traces.push(...generated.slice(0, 5).map((generatedRequest) => makeTrace(generatedRequest)));
  });
  return NextResponse.json(aggregateTelemetry(data.requests));
}
