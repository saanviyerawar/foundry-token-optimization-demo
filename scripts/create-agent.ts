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
      "You are a YouTube learning assistant.",
      "The client supplies transcript text extracted from a public YouTube URL.",
      "Return Markdown with exactly three sections: Key Points, Study Guide, and Flashcards.",
      "Key Points must be concise bullets.",
      "The Study Guide must organize the main concepts, definitions, relationships, and practical takeaways.",
      "Flashcards must use Q: and A: pairs and cover only facts supported by the transcript.",
      "Do not invent missing video content; state clearly when the supplied transcript is incomplete.",
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
