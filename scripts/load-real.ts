import { parseRealLoadOptions } from "../lib/azure-config";
import { getProvider, resolveProviderConfig } from "../lib/provider";
import type { ModelId } from "../lib/types";

const prompts = [
  ["gpt-5-nano", "Classify this request as billing, outage, or access: I cannot sign in after changing my password."],
  ["gpt-5-mini", "Explain how prompt-prefix caching reduces token cost for stable agent instructions."],
  ["gpt-4.1-mini", "Return JSON with the recommended toolbox for a CRM opportunity lookup and explain the selection."],
  ["claude-opus-5", "Compare routing, retrieval, caching, and tool compression as an enterprise optimization strategy."],
] as const satisfies ReadonlyArray<readonly [ModelId, string]>;

async function main() {
  try {
    process.loadEnvFile(".env.local");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const options = parseRealLoadOptions(process.argv.slice(2));
  const config = resolveProviderConfig();
  if (!options.execute) {
    console.log(`DRY RUN: ${options.count} planned real requests at ${options.ratePerSecond}/second, concurrency ${options.concurrency}, configured provider ${config.mode}.`);
    console.log("Re-run with --execute to generate real Azure model traffic. Maximums: 50 requests, 5 requests/second, concurrency 3.");
    return;
  }
  if (config.mode === "mock") throw new Error("Real load execution requires AI_PROVIDER=foundry or AI_PROVIDER=azure.");
  console.warn(`COST WARNING: generating ${options.count} real requests against ${config.mode}. Monitor quota and Azure Cost Management.`);
  const appUrl = process.env.AZURE_WEB_APP_URI?.replace(/\/$/, "");
  const provider = appUrl ? undefined : getProvider(config);
  let nextIndex = 0;
  const delayMs = Math.ceil(1000 / options.ratePerSecond);
  const worker = async () => {
    while (nextIndex < options.count) {
      const index = nextIndex++;
      const [model, prompt] = prompts[index % prompts.length];
      if (appUrl) {
        const response = await fetch(`${appUrl}/api/requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, priority: model === "gpt-5-nano" ? "latency" : model === "claude-opus-5" ? "quality" : "balanced" }),
        });
        const result = await response.json() as { error?: string; provider?: string; responseModel?: string; inputTokens?: number; outputTokens?: number; latencyMs?: number; traceId?: string };
        if (!response.ok) throw new Error(`Deployed app returned ${response.status}: ${result.error ?? "unknown error"}`);
        console.log(`${index + 1}/${options.count} ${result.provider} ${result.responseModel} ${(result.inputTokens ?? 0) + (result.outputTokens ?? 0)} tokens ${result.latencyMs} ms trace=${result.traceId ?? "n/a"}`);
      } else {
        const result = await provider!.complete({
          model,
          systemPrompt: "You are a concise optimization demo assistant. Do not invent Azure resources or evidence.",
          userPrompt: prompt,
        });
        console.log(`${index + 1}/${options.count} ${result.provider} ${result.responseModel} ${result.inputTokens + result.outputTokens} tokens ${result.latencyMs} ms trace=${result.traceId ?? "n/a"}`);
      }
      if (nextIndex < options.count) await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  };
  await Promise.all(Array.from({ length: Math.min(options.concurrency, options.count) }, worker));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
