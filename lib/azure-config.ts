export interface RealLoadOptions {
  execute: boolean;
  count: number;
  ratePerSecond: number;
  concurrency: number;
}

function numericOption(args: string[], name: string, fallback: number): number {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  const parsed = Number(args[index + 1]);
  if (!Number.isFinite(parsed)) throw new Error(`${name} requires a numeric value.`);
  return parsed;
}

export function parseRealLoadOptions(args: string[]): RealLoadOptions {
  const count = Math.floor(numericOption(args, "--count", 5));
  const ratePerSecond = numericOption(args, "--rate", 1);
  const concurrency = Math.floor(numericOption(args, "--concurrency", 2));
  if (count < 1 || count > 50) throw new Error("--count must be between 1 and 50.");
  if (ratePerSecond <= 0 || ratePerSecond > 5) throw new Error("--rate must be greater than 0 and at most 5 requests/second.");
  if (concurrency < 1 || concurrency > 3) throw new Error("--concurrency must be between 1 and 3.");
  return { execute: args.includes("--execute"), count, ratePerSecond, concurrency };
}

export const requiredAzureFiles = [
  "azure.yaml",
  "infra/main.bicep",
  "infra/main.parameters.json",
  "scripts/preprovision.ps1",
  "scripts/postprovision.ps1",
  "scripts/create-agent.ts",
] as const;
