import { access, readFile } from "fs/promises";
import path from "path";
import { requiredAzureFiles } from "../lib/azure-config";

async function main() {
  for (const relativePath of requiredAzureFiles) await access(path.join(process.cwd(), relativePath));
  const azureYaml = await readFile(path.join(process.cwd(), "azure.yaml"), "utf8");
  const parameters = JSON.parse(await readFile(path.join(process.cwd(), "infra", "main.parameters.json"), "utf8")) as { parameters?: Record<string, unknown> };
  if (!azureYaml.includes("host: appservice") || !azureYaml.includes("provider: bicep")) {
    throw new Error("azure.yaml must declare an App Service and Bicep infrastructure.");
  }
  for (const parameter of ["environmentName", "location", "principalId", "deployModelRouter"]) {
    if (!parameters.parameters?.[parameter]) throw new Error(`main.parameters.json is missing ${parameter}.`);
  }
  console.log("Azure configuration structure is valid.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
