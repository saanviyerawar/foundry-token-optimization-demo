export function normalizePrompt(prompt: string): string {
  return prompt.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

export function prefixCacheSavings(prefixTokens: number, requests: number, discount = 0.9) {
  if (requests <= 1) return 0;
  return Math.round(prefixTokens * (requests - 1) * discount);
}

export function semanticSimilarity(a: string, b: string): number {
  const left = new Set(normalizePrompt(a).split(" ").filter(Boolean));
  const right = new Set(normalizePrompt(b).split(" ").filter(Boolean));
  const intersection = [...left].filter((word) => right.has(word)).length;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

export function cacheComparison(requests = 100) {
  const prefixSaved = prefixCacheSavings(620, requests);
  const semanticHits = Math.round(requests * 0.28);
  return {
    requests,
    noCacheTokens: requests * 980,
    prefixCacheTokens: requests * 980 - prefixSaved,
    responseCacheTokens: (requests - semanticHits) * 980,
    prefixSaved,
    semanticHits,
  };
}
