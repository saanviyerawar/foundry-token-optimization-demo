import type { ModelId, RouteRequest } from "./types";

const profiles: Record<ModelId, { cost: number; latency: number; quality: number; capacity: number }> = {
  "gpt-5-nano": { cost: 1, latency: 1, quality: 2, capacity: 3 },
  "gpt-5-mini": { cost: 2, latency: 2, quality: 4, capacity: 4 },
  "gpt-4.1-mini": { cost: 2, latency: 2, quality: 3, capacity: 5 },
  "claude-opus-5": { cost: 5, latency: 5, quality: 5, capacity: 5 },
};

export function estimateComplexity(prompt: string): number {
  const words = prompt.trim().split(/\s+/).filter(Boolean).length;
  const signals = (prompt.match(/\b(analy[sz]e|compare|architecture|trade-?off|multi-step|strategy|reason)\b/gi) ?? []).length;
  return Math.min(5, Math.max(1, Math.ceil(words / 28) + Math.min(3, signals)));
}

export function chooseModel(
  prompt: string,
  priority: RouteRequest["priority"],
): { model: ModelId; complexity: number; rationale: string } {
  const complexity = estimateComplexity(prompt);
  let model: ModelId;
  if (priority === "quality" && complexity >= 4) model = "claude-opus-5";
  else if (priority === "latency" && complexity <= 3) model = "gpt-5-nano";
  else if (priority === "cost" && complexity <= 2) model = "gpt-5-nano";
  else if (complexity >= 4) model = "gpt-5-mini";
  else if (prompt.toLowerCase().includes("tool") || prompt.toLowerCase().includes("json")) model = "gpt-4.1-mini";
  else model = "gpt-5-mini";
  const p = profiles[model];
  return {
    model,
    complexity,
    rationale: `Complexity ${complexity}/5 with ${priority} priority. ${model} balances relative cost ${p.cost}/5, latency ${p.latency}/5, quality ${p.quality}/5, and capacity ${p.capacity}/5.`,
  };
}

export function createRequest(
  prompt: string,
  priority: RouteRequest["priority"],
  index = Date.now(),
): RouteRequest {
  const route = chooseModel(prompt, priority);
  const inputTokens = Math.max(18, Math.round(prompt.length / 3.7) + 42);
  const outputTokens = 60 + route.complexity * 42 + (index % 37);
  const rate = route.model === "gpt-5-nano" ? 92 : route.model === "claude-opus-5" ? 24 : 55;
  const latencyMs = Math.round(180 + (outputTokens / rate) * 1000 + route.complexity * 95);
  const status = index % 17 === 0 ? "throttled" : index % 29 === 0 ? "error" : "success";
  const cacheHit = index % 4 === 0;
  const costRate = { "gpt-5-nano": 0.0000007, "gpt-5-mini": 0.0000025, "gpt-4.1-mini": 0.0000018, "claude-opus-5": 0.000014 }[route.model];
  const promptHash = [...prompt].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 0).toString(36);
  const createdAt = index < 10_000
    ? new Date(Date.UTC(2026, 8, 16, 4, 0) + index * 45_000).toISOString()
    : new Date(Date.now() - (index % 6) * 60000).toISOString();
  return {
    id: `req-${index}-${promptHash.slice(0, 7)}`,
    createdAt,
    prompt,
    priority,
    ...route,
    inputTokens,
    outputTokens,
    latencyMs,
    status,
    tokensPerSecond: Math.round(rate * (0.86 + (index % 9) / 50)),
    cacheHit,
    estimatedCost: Number(((inputTokens + outputTokens) * costRate * (cacheHit ? 0.72 : 1)).toFixed(5)),
  };
}
