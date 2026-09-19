import { AIProjectClient, type ToolUnion } from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

function isNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "statusCode" in error && (error as { statusCode?: number }).statusCode === 404;
}

async function main() {
  const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT;
  const agentName = process.env.FOUNDRY_AGENT_NAME ?? "foundry-optimization-agent";
  const browserAutomationConnectionId = process.env.BROWSER_AUTOMATION_CONNECTION_ID;
  const searchEndpoint = process.env.SEARCH_SERVICE_ENDPOINT;
  const knowledgeBaseName = process.env.FOUNDRY_IQ_KNOWLEDGE_BASE_NAME;
  const knowledgeConnectionName = process.env.FOUNDRY_IQ_CONNECTION_NAME;
  const model = process.env.FOUNDRY_AGENT_MODEL
    ?? (browserAutomationConnectionId ? "gpt-4-1-mini" : process.env.MODEL_ROUTER_DEPLOYMENT_NAME)
    ?? process.env.MODEL_DEPLOYMENT_GPT_5_MINI
    ?? "model-router";
  if (!endpoint) throw new Error("FOUNDRY_PROJECT_ENDPOINT is required. Run azd provision first.");

  const project = new AIProjectClient(endpoint, new DefaultAzureCredential());
  const tools: ToolUnion[] = [{
    type: "web_search" as const,
    search_context_size: "medium" as const,
  }];
  if (browserAutomationConnectionId) {
    tools.unshift({
      type: "browser_automation_preview" as const,
      browser_automation_preview: {
        connection: {
          project_connection_id: browserAutomationConnectionId,
        },
      },
    });
  }
  if (searchEndpoint && knowledgeBaseName && knowledgeConnectionName) {
    tools.unshift({
      type: "mcp",
      server_label: "youtube-learning-knowledge",
      server_url: `${searchEndpoint}/knowledgebases/${knowledgeBaseName}/mcp?api-version=2026-08-01-preview`,
      require_approval: "never",
      allowed_tools: ["knowledge_base_retrieve"],
      project_connection_id: knowledgeConnectionName,
    });
  }
  const definition = {
    kind: "prompt" as const,
    model,
    tools,
    tool_choice: "auto",
    instructions: [
      "You are a YouTube learning assistant.",
      "The client supplies either a public YouTube URL or transcript text.",
      "For a YouTube URL, first use browser automation to open the video.",
      "Also retrieve Foundry IQ knowledge using the exact URL or video ID; if a matching curated video record exists, use it as grounded source material.",
      "Dismiss any cookie or consent dialog, expand the description with More, select Show transcript, wait for the transcript panel, and read all visible transcript segments.",
      "If Show transcript is not visible, inspect the page controls and overflow menus before concluding that no transcript is available.",
      "If browser automation cannot expose a transcript, use web search to locate accessible captions or a trustworthy indexed transcript and verify it refers to the supplied video.",
      "Base the learning pack on caption or transcript content, not only the title, description, comments, or unrelated summaries.",
      "Include source citations returned by web search.",
      "If sufficient caption or transcript content cannot be retrieved, say so explicitly and ask the user to paste the transcript.",
      "Return Markdown with exactly three sections: Key Points, Study Guide, and Flashcards.",
      "Key Points must be concise bullets.",
      "The Study Guide must organize the main concepts, definitions, relationships, and practical takeaways.",
      "Flashcards must use Q: and A: pairs and cover only facts supported by the transcript.",
      "Do not invent missing video content.",
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
