import { access, readFile } from "fs/promises";
import path from "path";
import { requiredAzureFiles } from "../lib/azure-config";

async function main() {
  for (const relativePath of requiredAzureFiles) await access(path.join(process.cwd(), relativePath));
  const azureYaml = await readFile(path.join(process.cwd(), "azure.yaml"), "utf8");
  const parameters = JSON.parse(await readFile(path.join(process.cwd(), "infra", "main.parameters.json"), "utf8")) as { parameters?: Record<string, unknown> };
  if (!azureYaml.includes("provider: bicep") || azureYaml.includes("host: appservice")) {
    throw new Error("azure.yaml must declare Foundry Bicep infrastructure without an application service.");
  }
  for (const parameter of ["environmentName", "location", "searchLocation", "principalId", "deployModelRouter", "deployFoundryIQ", "deployBrowserAutomation"]) {
    if (!parameters.parameters?.[parameter]) throw new Error(`main.parameters.json is missing ${parameter}.`);
  }
  console.log("Azure configuration structure is valid.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
