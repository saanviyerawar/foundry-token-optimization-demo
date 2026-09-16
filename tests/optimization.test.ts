import { describe, expect, it } from "vitest";
import { cacheComparison, prefixCacheSavings, semanticSimilarity } from "../lib/caching";
import { parseRealLoadOptions } from "../lib/azure-config";
import { runEvaluation, scoreItem } from "../lib/evaluations";
import { mapModelToDeployment, resolveProviderConfig } from "../lib/provider";
import { retrieve } from "../lib/retrieval";
import { chooseModel, estimateComplexity } from "../lib/routing";
import { aggregateTelemetry } from "../lib/telemetry";
import { toolboxMetrics, tokenEstimate, tools } from "../lib/toolboxes";
import { createRequest } from "../lib/routing";
import type { KnowledgeDocument } from "../lib/types";

describe("model routing", () => {
  it("routes simple latency-sensitive work to nano", () => {
    expect(chooseModel("Classify this message.", "latency").model).toBe("gpt-5-nano");
  });

  it("routes complex quality-sensitive work to the premium model", () => {
    const prompt = "Analyze and compare the architecture trade-offs for a multi-step enterprise strategy and reason about risks.";
    expect(estimateComplexity(prompt)).toBeGreaterThanOrEqual(4);
    expect(chooseModel(prompt, "quality").model).toBe("claude-opus-5");
  });
});

describe("retrieval", () => {
  const documents: KnowledgeDocument[] = [
    { id: "a", title: "Budget", content: "The default context budget is 1,200 tokens.", source: "seed", createdAt: "" },
    { id: "b", title: "Tools", content: "Group MCP tools into progressive toolboxes.", source: "seed", createdAt: "" },
  ];

  it("ranks the matching chunk first", () => {
    const results = retrieve("What is the context token budget?", documents);
    expect(results[0].title).toBe("Budget");
    expect(results[0].score).toBeGreaterThan(0);
  });
});

describe("tool compression", () => {
  it("estimates positive schema tokens and grouping savings", () => {
    expect(tokenEstimate(tools[0])).toBeGreaterThan(tools[0].schemaFields);
    const metrics = toolboxMetrics("CRM");
    expect(metrics.groupedTokens).toBeLessThan(metrics.individualTokens);
    expect(metrics.savings).toBeGreaterThan(50);
    expect(metrics.selectionAccuracyGrouped).toBeGreaterThan(metrics.selectionAccuracyIndividual);
  });
});

describe("evaluation scoring", () => {
  it("scores and aggregates a dataset deterministically", () => {
    const item = { input: "context budget", expected: "1,200 tokens", answer: "The context budget is 1,200 tokens." };
    expect(scoreItem(item, 1).scores.Groundedness).toBeGreaterThan(3);
    const run = runEvaluation([item], 3);
    expect(run.rows).toHaveLength(1);
    expect(run.aggregates.Safety).toBeGreaterThanOrEqual(3.8);
  });
});

describe("caching", () => {
  it("calculates prefix and semantic cache benefits", () => {
    expect(prefixCacheSavings(100, 10)).toBe(810);
    expect(semanticSimilarity("Find the token budget policy", "Find token budget policy")).toBeGreaterThan(0.7);
    const comparison = cacheComparison(100);
    expect(comparison.prefixCacheTokens).toBeLessThan(comparison.noCacheTokens);
    expect(comparison.responseCacheTokens).toBeLessThan(comparison.noCacheTokens);
  });
});

describe("telemetry aggregation", () => {
  it("sums requests and tokens by model", () => {
    const requests = [createRequest("Classify this.", "cost", 1), createRequest("Analyze architecture trade-offs.", "quality", 2)];
    const telemetry = aggregateTelemetry(requests);
    expect(telemetry.totalRequests).toBe(2);
    expect(telemetry.totalTokens).toBe(requests.reduce((sum, request) => sum + request.inputTokens + request.outputTokens, 0));
    expect(telemetry.byModel.length).toBeGreaterThan(0);
  });
});

describe("Azure provider configuration", () => {
  it("maps logical model names to tenant deployment names", () => {
    const config = resolveProviderConfig({
      AI_PROVIDER: "foundry",
      FOUNDRY_PROJECT_ENDPOINT: "https://example.services.ai.azure.com/api/projects/demo",
      MODEL_DEPLOYMENT_GPT_5_MINI: "tenant-mini",
      MODEL_DEPLOYMENT_CLAUDE_OPUS_5: "approved-premium-fallback",
    });
    expect(mapModelToDeployment("gpt-5-mini", config)).toBe("tenant-mini");
    expect(mapModelToDeployment("claude-opus-5", config)).toBe("approved-premium-fallback");
  });

  it("rejects an unsupported provider mode", () => {
    expect(() => resolveProviderConfig({ AI_PROVIDER: "unknown" })).toThrow(/AI_PROVIDER/);
  });
});

describe("real load safeguards", () => {
  it("uses conservative dry-run defaults", () => {
    expect(parseRealLoadOptions([])).toEqual({ execute: false, count: 5, ratePerSecond: 1, concurrency: 2 });
  });

  it("caps request count and concurrency", () => {
    expect(() => parseRealLoadOptions(["--count", "51"])).toThrow(/between 1 and 50/);
    expect(() => parseRealLoadOptions(["--concurrency", "4"])).toThrow(/between 1 and 3/);
  });
});
