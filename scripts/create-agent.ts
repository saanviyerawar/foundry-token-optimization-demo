import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "statusCode" in error && (error as { statusCode?: number }).statusCode === 404;
}

async function main() {
  const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT;
  const agentName = process.env.FOUNDRY_AGENT_NAME ?? "foundry-optimization-agent";
  const model = process.env.MODEL_DEPLOYMENT_GPT_5_MINI ?? "gpt-5-mini";
  if (!endpoint) throw new Error("FOUNDRY_PROJECT_ENDPOINT is required. Run azd provision or npm run azure:env.");

  const project = new AIProjectClient(endpoint, new DefaultAzureCredential());
  const definition = {
    kind: "prompt" as const,
    model,
    instructions: [
      "You are the Foundry Agent Optimization Demo agent.",
      "Answer concisely and identify assumptions.",
      "Prefer the smallest adequate model, retrieve only relevant evidence, and preserve source attribution.",
      "Never claim a tool, knowledge source, cache, or Azure resource was used unless it was actually available.",
    ].join(" "),
  };

  try {
    await project.agents.get(agentName);
    const updated = await project.agents.update(agentName, definition);
    console.log(`Agent ${updated.name} is current.`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    const created = await project.agents.create(agentName, definition);
    console.log(`Created agent ${created.name}.`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
