import { NextResponse } from "next/server";
import { resolveProviderConfig } from "@/lib/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = resolveProviderConfig();
  return NextResponse.json({
    mode: config.mode,
    projectConfigured: Boolean(config.foundryProjectEndpoint),
    agentConfigured: Boolean(config.foundryAgentName),
    agentMode: config.useAgent,
    applicationInsightsConfigured: Boolean(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING),
    modelRouterConfigured: Boolean(process.env.MODEL_ROUTER_DEPLOYMENT_NAME),
  });
}
