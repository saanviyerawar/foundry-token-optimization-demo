import type { RouteRequest, TelemetrySummary } from "./types";

export function aggregateTelemetry(requests: RouteRequest[]): TelemetrySummary {
  const byModelMap = new Map<string, { requests: number; tokens: number; cost: number; latency: number }>();
  const byTimeMap = new Map<string, { requests: number; tokens: number; latency: number; cost: number; timeToFirstByte: number }>();
  let inputTokens = 0;
  let outputTokens = 0;
  let estimatedCost = 0;
  let latency = 0;
  let cacheSavings = 0;
  for (const request of requests) {
    inputTokens += request.inputTokens;
    outputTokens += request.outputTokens;
    estimatedCost += request.estimatedCost;
    latency += request.latencyMs;
    if (request.cacheHit) cacheSavings += request.inputTokens * 0.9;
    const model = byModelMap.get(request.model) ?? { requests: 0, tokens: 0, cost: 0, latency: 0 };
    model.requests += 1;
    model.tokens += request.inputTokens + request.outputTokens;
    model.cost += request.estimatedCost;
    model.latency += request.latencyMs;
    byModelMap.set(request.model, model);
    const key = new Date(request.createdAt).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    const time = byTimeMap.get(key) ?? { requests: 0, tokens: 0, latency: 0, cost: 0, timeToFirstByte: 0 };
    time.requests += 1;
    time.tokens += request.inputTokens + request.outputTokens;
    time.latency += request.latencyMs;
    time.cost += request.estimatedCost;
    time.timeToFirstByte += Math.round(request.latencyMs * 0.34);
    byTimeMap.set(key, time);
  }
  return {
    totalRequests: requests.length,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost: Number(estimatedCost.toFixed(4)),
    cacheSavings: Math.round(cacheSavings),
    averageLatency: requests.length ? Math.round(latency / requests.length) : 0,
    byModel: [...byModelMap.entries()].map(([model, value]) => ({
      model: model as RouteRequest["model"],
      ...value,
      cost: Number(value.cost.toFixed(4)),
      latency: Math.round(value.latency / value.requests),
    })),
    overTime: [...byTimeMap.entries()].map(([time, value]) => ({
      time,
      ...value,
      latency: Math.round(value.latency / value.requests),
      cost: Number(value.cost.toFixed(5)),
      timeToFirstByte: Math.round(value.timeToFirstByte / value.requests),
    })),
  };
}
