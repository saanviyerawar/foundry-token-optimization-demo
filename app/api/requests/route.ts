import { NextRequest, NextResponse } from "next/server";
import { createRequest } from "@/lib/routing";
import { makeTrace } from "@/lib/seed-data";
import { getProvider, ProviderConfigurationError, ProviderRequestError, resolveProviderConfig } from "@/lib/provider";
import { readData, updateData } from "@/lib/storage";
import type { RouteRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json((await readData()).requests);
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { prompt?: unknown; priority?: unknown };
  const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 4000) : "";
  const priorities: RouteRequest["priority"][] = ["cost", "latency", "quality", "balanced"];
  const priority = priorities.includes(body.priority as RouteRequest["priority"]) ? body.priority as RouteRequest["priority"] : "balanced";
  if (prompt.length < 3) return NextResponse.json({ error: "Prompt must contain at least 3 characters." }, { status: 400 });
  const routed = createRequest(prompt, priority);
  const config = resolveProviderConfig();
  if (config.mode === "mock") {
    await updateData((data) => {
      data.requests.push(routed);
      data.traces.push(makeTrace(routed));
    });
    return NextResponse.json(routed, { status: 201 });
  }
  try {
    const completion = await getProvider(config).complete({
      model: routed.model,
      systemPrompt: "You are the Foundry Agent Optimization Demo. Give a concise, grounded answer and identify assumptions.",
      userPrompt: prompt,
    });
    routed.inputTokens = completion.inputTokens;
    routed.outputTokens = completion.outputTokens;
    routed.latencyMs = completion.latencyMs;
    routed.tokensPerSecond = completion.latencyMs > 0 ? Math.round((completion.outputTokens / completion.latencyMs) * 1000) : 0;
    routed.provider = completion.provider;
    routed.responseModel = completion.responseModel;
    routed.responsePreview = completion.text.slice(0, 500);
    routed.traceId = completion.traceId;
    await updateData((data) => {
      data.requests.push(routed);
      data.traces.push(makeTrace(routed, { output: completion.text, traceId: completion.traceId, provider: completion.provider }));
    });
    return NextResponse.json(routed, { status: 201 });
  } catch (error) {
    if (error instanceof ProviderConfigurationError || error instanceof ProviderRequestError) {
      return NextResponse.json({ error: error.message, provider: config.mode }, { status: 502 });
    }
    throw error;
  }
}
