export const requiredAzureFiles = [
  "azure.yaml",
  "infra/main.bicep",
  "infra/main.parameters.json",
  "scripts/preprovision.ps1",
  "scripts/postprovision.ps1",
  "scripts/create-agent.ts",
  "scripts/setup-portal-demo.ps1",
  "scripts/setup-portal-demo.ts",
  "data/portal-knowledge.json",
  "data/youtube-transcript-evaluation.jsonl",
] as const;
