import { readFile } from "fs/promises";
import path from "path";
import {
  AIProjectClient,
  type AgentDefinitionUnion,
  type ToolboxToolUnion,
} from "@azure/ai-projects";
import { DefaultAzureCredential } from "@azure/identity";

interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  source: string;
}

interface EvaluationRow {
  input: string;
  expected: string;
  context: string;
}

interface Evaluation {
  id: string;
  name: string;
}

interface EvaluationList {
  data?: Evaluation[];
}

interface EvaluationRun {
  id: string;
  name: string;
  status?: string;
  report_url?: string;
}

interface EvaluationRunList {
  data?: EvaluationRun[];
}

const projectEndpoint = required("FOUNDRY_PROJECT_ENDPOINT");
const foundryAccountEndpoint = required("FOUNDRY_ACCOUNT_ENDPOINT");
const projectResourceId = required("FOUNDRY_PROJECT_RESOURCE_ID");
const searchEndpoint = required("SEARCH_SERVICE_ENDPOINT");
const indexName = required("FOUNDRY_IQ_INDEX_NAME");
const knowledgeSourceName = required("FOUNDRY_IQ_SOURCE_NAME");
const knowledgeBaseName = required("FOUNDRY_IQ_KNOWLEDGE_BASE_NAME");
const knowledgeConnectionName = required("FOUNDRY_IQ_CONNECTION_NAME");
const modelRouterDeployment = required("MODEL_ROUTER_DEPLOYMENT_NAME");
const credential = new DefaultAzureCredential();
const project = new AIProjectClient(projectEndpoint, credential);

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function requestJson<T>(url: string, scope: string, init: RequestInit): Promise<T> {
  const token = await credential.getToken(scope);
  if (!token) throw new Error(`Unable to acquire a token for ${scope}.`);
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token.token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${url} failed (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) as T : {} as T;
}

async function withRolePropagationRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < 6) await new Promise((resolve) => setTimeout(resolve, attempt * 15_000));
    }
  }
  throw lastError;
}

async function upsertAgent(name: string, definition: AgentDefinitionUnion): Promise<void> {
  try {
    await project.agents.get(name);
    await project.agents.update(name, definition);
    console.log(`Agent ${name} is current.`);
  } catch (error) {
    const statusCode = typeof error === "object" && error !== null && "statusCode" in error
      ? (error as { statusCode?: number }).statusCode
      : undefined;
    if (statusCode !== 404) throw error;
    await project.agents.create(name, definition);
    console.log(`Created agent ${name}.`);
  }
}

async function createAgentsAndToolbox(): Promise<void> {
  const instructions = [
    "You are a YouTube learning assistant.",
    "Given transcript text, return Markdown with exactly three sections: Key Points, Study Guide, and Flashcards.",
    "Key Points must be concise bullets, the Study Guide must organize concepts and practical takeaways, and Flashcards must use Q: and A: pairs.",
    "Use only facts present in the transcript and state when transcript content is incomplete.",
  ].join(" ");

  await upsertAgent("youtube-baseline-agent", {
    kind: "prompt",
    model: "gpt-5-mini",
    instructions,
  });
  await upsertAgent("youtube-nano-agent", {
    kind: "prompt",
    model: "gpt-5-nano",
    instructions,
  });
  await upsertAgent("youtube-router-agent", {
    kind: "prompt",
    model: modelRouterDeployment,
    instructions,
  });

  const tools: ToolboxToolUnion[] = [
    {
      type: "web_search",
      name: "current-guidance",
      description: "Search current public guidance only when the question requires fresh information.",
      search_context_size: "low",
    },
    {
      type: "toolbox_search",
      name: "tool-discovery",
      description: "Discover only the tools relevant to the current request.",
    },
  ];
  const toolbox = await project.toolboxes.createVersion(
    "youtube-learning-toolbox",
    tools,
    {
      description: "A compact toolbox for discovering video context and formatting transcript-derived learning material.",
      metadata: { demo: "youtube-learning-bot", principle: "optimize-context" },
    },
  );
  console.log(`Toolbox youtube-learning-toolbox version ${toolbox.version} is ready.`);
}

async function createKnowledgeBase(): Promise<void> {
  const apiVersion = "2026-08-01-preview";
  const searchScope = "https://search.azure.com/.default";
  const documents = JSON.parse(
    await readFile(path.join(process.cwd(), "data", "portal-knowledge.json"), "utf8"),
  ) as KnowledgeDocument[];

  await withRolePropagationRetry(() => requestJson(
    `${searchEndpoint}/indexes/${indexName}?api-version=${apiVersion}`,
    searchScope,
    {
      method: "PUT",
      body: JSON.stringify({
        name: indexName,
        description: "Token economics, evaluation-driven development, optimization principles, and operations guidance.",
        fields: [
          { name: "id", type: "Edm.String", key: true, searchable: true, retrievable: true, filterable: true },
          { name: "title", type: "Edm.String", searchable: true, retrievable: true },
          { name: "category", type: "Edm.String", searchable: true, retrievable: true, filterable: true },
          { name: "content", type: "Edm.String", searchable: true, retrievable: true, analyzer: "en.microsoft" },
          { name: "source", type: "Edm.String", searchable: true, retrievable: true },
        ],
        semantic: {
          defaultConfiguration: "token-optimization-semantic",
          configurations: [{
            name: "token-optimization-semantic",
            prioritizedFields: {
              titleField: { fieldName: "title" },
              prioritizedContentFields: [{ fieldName: "content" }],
              prioritizedKeywordsFields: [{ fieldName: "category" }],
            },
          }],
        },
      }),
    },
  ));

  await requestJson(
    `${searchEndpoint}/indexes/${indexName}/docs/index?api-version=${apiVersion}`,
    searchScope,
    {
      method: "POST",
      body: JSON.stringify({
        value: documents.map((document) => ({ "@search.action": "mergeOrUpload", ...document })),
      }),
    },
  );

  await requestJson(
    `${searchEndpoint}/knowledgesources/${knowledgeSourceName}?api-version=${apiVersion}`,
    searchScope,
    {
      method: "PUT",
      body: JSON.stringify({
        name: knowledgeSourceName,
        kind: "searchIndex",
        description: "Curated token optimization and evaluation guidance for the portal demo.",
        searchIndexParameters: {
          searchIndexName: indexName,
          semanticConfigurationName: "token-optimization-semantic",
          searchFields: [{ name: "title" }, { name: "content" }, { name: "category" }],
          sourceDataFields: [
            { name: "id" },
            { name: "title" },
            { name: "content" },
            { name: "category" },
            { name: "source" },
          ],
        },
      }),
    },
  );

  await requestJson(
    `${searchEndpoint}/knowledgebases/${knowledgeBaseName}?api-version=${apiVersion}`,
    searchScope,
    {
      method: "PUT",
      body: JSON.stringify({
        name: knowledgeBaseName,
        description: "Grounded knowledge for the Foundry token optimization demonstration.",
        retrievalInstructions: "Retrieve only material relevant to token economics, evaluation, routing, context, tools, retrieval, caching, simplification, telemetry, tracing, or spend.",
        answerInstructions: "Answer concisely, preserve source attribution, and distinguish measured facts from recommendations.",
        outputMode: "extractiveData",
        knowledgeSources: [{ name: knowledgeSourceName }],
        models: [{
          kind: "azureOpenAI",
          azureOpenAIParameters: {
            resourceUri: foundryAccountEndpoint,
            deploymentId: "gpt-5-mini",
            modelName: "gpt-5-mini",
          },
        }],
        retrievalReasoningEffort: { kind: "minimal" },
      }),
    },
  );

  const mcpEndpoint = `${searchEndpoint}/knowledgebases/${knowledgeBaseName}/mcp?api-version=${apiVersion}`;
  await requestJson(
    `https://management.azure.com${projectResourceId}/connections/${knowledgeConnectionName}?api-version=2025-10-01-preview`,
    "https://management.azure.com/.default",
    {
      method: "PUT",
      body: JSON.stringify({
        name: knowledgeConnectionName,
        type: "Microsoft.MachineLearningServices/workspaces/connections",
        properties: {
          authType: "ProjectManagedIdentity",
          category: "RemoteTool",
          target: mcpEndpoint,
          isSharedToAll: true,
          audience: "https://search.azure.com/",
          metadata: { ApiType: "Azure" },
        },
      }),
    },
  );

  await upsertAgent("youtube-learning-knowledge-agent", {
    kind: "prompt",
    model: "gpt-5-mini",
    instructions: "Create Key Points, a Study Guide, and Q/A Flashcards from supplied transcript text. Use the knowledge base for supporting token-optimization guidance and include source citations.",
    tools: [{
      type: "mcp",
      server_label: "token-optimization-knowledge",
      server_url: mcpEndpoint,
      require_approval: "never",
      allowed_tools: ["knowledge_base_retrieve"],
      project_connection_id: knowledgeConnectionName,
    }],
  });
  console.log(`Knowledge base ${knowledgeBaseName} and its agent are ready.`);
}

async function getOrCreateEvaluation(
  name: string,
  itemSchema: Record<string, unknown>,
  testingCriteria: Record<string, unknown>[],
): Promise<Evaluation> {
  const foundryScope = "https://ai.azure.com/.default";
  const evaluations = await requestJson<EvaluationList>(
    `${projectEndpoint}/openai/v1/evals?limit=100`,
    foundryScope,
    { method: "GET" },
  );
  let evaluation = evaluations.data?.find((item) => item.name === name);
  if (!evaluation) {
    evaluation = await requestJson<Evaluation>(
      `${projectEndpoint}/openai/v1/evals`,
      foundryScope,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          data_source_config: {
            type: "custom",
            item_schema: itemSchema,
            include_sample_schema: true,
          },
          testing_criteria: testingCriteria,
        }),
      },
    );
  }
  return evaluation;
}

async function createAndWaitForRun(
  evaluation: Evaluation,
  runName: string,
  dataSource: Record<string, unknown>,
  evaluationLevel = "turn",
): Promise<void> {
  const foundryScope = "https://ai.azure.com/.default";
  const runs = await requestJson<EvaluationRunList>(
    `${projectEndpoint}/openai/v1/evals/${evaluation.id}/runs?limit=100`,
    foundryScope,
    { method: "GET" },
  );
  const existing = runs.data?.find((run) => run.name === runName && run.status !== "failed");
  let run = existing ?? await requestJson<EvaluationRun>(
    `${projectEndpoint}/openai/v1/evals/${evaluation.id}/runs`,
    foundryScope,
    {
      method: "POST",
      body: JSON.stringify({
        name: runName,
        evaluation_level: evaluationLevel,
        data_source: dataSource,
      }),
    },
  );

  for (let attempt = 0; attempt < 60; attempt += 1) {
    run = await requestJson<EvaluationRun>(
      `${projectEndpoint}/openai/v1/evals/${evaluation.id}/runs/${run.id}`,
      foundryScope,
      { method: "GET" },
    );
    if (run.status === "completed") {
      console.log(`Completed evaluation ${evaluation.name}: ${run.report_url ?? run.id}`);
      return;
    }
    if (run.status === "failed" || run.status === "canceled") {
      throw new Error(`Evaluation ${evaluation.name} ended with status ${run.status}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error(`Evaluation ${evaluation.name} did not complete within 10 minutes.`);
}

function evaluator(
  name: string,
  evaluatorName: string,
  dataMapping: Record<string, string>,
  initializationParameters?: Record<string, string>,
): Record<string, unknown> {
  return {
    type: "azure_ai_evaluator",
    name,
    evaluator_name: evaluatorName,
    ...(initializationParameters ? { initialization_parameters: initializationParameters } : {}),
    data_mapping: dataMapping,
  };
}

async function createModelEvaluation(model: string, rows: EvaluationRow[]): Promise<void> {
  const responseMapping = { query: "{{item.query}}", response: "{{sample.output_text}}" };
  const safetyMapping = { query: "{{item.query}}", response: "{{sample.output_text}}" };
  const criteria = [
    evaluator("Relevance", "builtin.relevance", responseMapping, { model: "gpt-5-mini" }),
    evaluator("Groundedness", "builtin.groundedness", {
      query: "{{item.query}}",
      response: "{{sample.output_text}}",
      context: "{{item.context}}",
    }, { deployment_name: "gpt-5-mini" }),
    evaluator("Coherence", "builtin.coherence", responseMapping, { model: "gpt-5-mini" }),
    evaluator("Fluency", "builtin.fluency", { response: "{{sample.output_text}}" }, { model: "gpt-5-mini" }),
    evaluator("Violence", "builtin.violence", safetyMapping),
    evaluator("Self Harm", "builtin.self_harm", safetyMapping),
    evaluator("Indirect Attack", "builtin.indirect_attack", safetyMapping),
    evaluator("Protected Material", "builtin.protected_material", safetyMapping),
    evaluator("Sexual", "builtin.sexual", safetyMapping),
    evaluator("Hate and Unfairness", "builtin.hate_unfairness", safetyMapping),
    evaluator("Code Vulnerability", "builtin.code_vulnerability", safetyMapping),
  ];
  const evaluation = await getOrCreateEvaluation(
    `YouTube Learning Bot - ${model} - Quality and Safety`,
    {
      type: "object",
      properties: {
        query: { type: "string" },
        ground_truth: { type: "string" },
        context: { type: "string" },
      },
      required: ["query", "ground_truth", "context"],
    },
    criteria,
  );
  await createAndWaitForRun(evaluation, `${model}-quality-safety-v1`, {
    type: "azure_ai_target_completions",
    source: {
      type: "file_content",
      content: rows.map((row) => ({
        item: { query: row.input, ground_truth: row.expected, context: row.context },
      })),
    },
    input_messages: {
      type: "template",
      template: [{
        type: "message",
        role: "user",
        content: { type: "input_text", text: "{{item.query}}" },
      }],
    },
    target: {
      type: "azure_ai_model",
      model,
      sampling_params: { max_completion_tokens: 500 },
    },
  });
}

async function createAgentProcessEvaluation(): Promise<void> {
  const query = [
    { role: "system", content: "Use the transcript tool, then return Key Points, a Study Guide, and Flashcards." },
    { role: "user", content: "Create learning material for https://www.youtube.com/watch?v=demo123." },
  ];
  const response = [
    {
      role: "assistant",
      content: [{
        type: "tool_call",
        tool_call_id: "call_transcript_001",
        name: "get_youtube_transcript",
        arguments: { url: "https://www.youtube.com/watch?v=demo123" },
      }],
    },
    {
      role: "tool",
      tool_call_id: "call_transcript_001",
      content: [{
        type: "tool_result",
        tool_result: {
          title: "Evaluation-driven token optimization",
          transcript: "Establish an evaluation baseline. Route simple work to smaller models, retrieve only relevant context, and verify quality, safety, latency, and total solution cost after every change.",
        },
      }],
    },
    {
      role: "assistant",
      content: [{
        type: "text",
        text: "## Key Points\n- Establish an evaluation baseline.\n- Optimize routing and context while preserving quality and safety.\n\n## Study Guide\nMeasure quality, latency, and complete solution cost after each controlled change.\n\n## Flashcards\nQ: What comes before optimization?\nA: An evaluation baseline.",
      }],
    },
  ];
  const toolDefinitions = [{
    name: "get_youtube_transcript",
    description: "Retrieve the available transcript and title for a public YouTube URL.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "Public YouTube video URL." },
      },
      required: ["url"],
    },
  }];
  const commonMapping = {
    query: "{{item.query}}",
    response: "{{item.response}}",
    tool_definitions: "{{item.tool_definitions}}",
  };
  const criteria = [
    evaluator("Tool Selection", "builtin.tool_selection", commonMapping, { model: "gpt-5-mini" }),
    evaluator("Tool Output Utilization", "builtin.tool_output_utilization", commonMapping, { model: "gpt-5-mini" }),
    evaluator("Tool Call Success", "builtin.tool_call_success", {
      response: "{{item.response}}",
      tool_definitions: "{{item.tool_definitions}}",
    }, { model: "gpt-5-mini" }),
    evaluator("Tool Call Accuracy", "builtin.tool_call_accuracy", commonMapping, { model: "gpt-5-mini" }),
    evaluator("Tool Input Accuracy", "builtin.tool_input_accuracy", commonMapping, { model: "gpt-5-mini" }),
    evaluator("Task Completion", "builtin.task_completion", commonMapping, { deployment_name: "gpt-5-mini" }),
    evaluator("Task Adherence", "builtin.task_adherence", commonMapping, { deployment_name: "gpt-5-mini" }),
    evaluator("Intent Resolution", "builtin.intent_resolution", commonMapping, { model: "gpt-5-mini" }),
  ];
  const evaluation = await getOrCreateEvaluation(
    "YouTube Learning Bot - Agent and Tool Criteria",
    {
      type: "object",
      properties: {
        query: { anyOf: [{ type: "string" }, { type: "array", items: { type: "object" } }] },
        response: { anyOf: [{ type: "string" }, { type: "array", items: { type: "object" } }] },
        tool_definitions: { type: "array", items: { type: "object" } },
      },
      required: ["query", "response", "tool_definitions"],
    },
    criteria,
  );
  await createAndWaitForRun(evaluation, "agent-tool-criteria-v1", {
    type: "jsonl",
    source: {
      type: "file_content",
      content: [{ item: { query, response, tool_definitions: toolDefinitions } }],
    },
  });
}

async function createCustomerSatisfactionEvaluation(): Promise<void> {
  const evaluation = await getOrCreateEvaluation(
    "YouTube Learning Bot - Customer Satisfaction",
    {
      type: "object",
      properties: { messages: { type: "array", items: { type: "object" } } },
      required: ["messages"],
    },
    [evaluator(
      "Customer Satisfaction",
      "builtin.customer_satisfaction",
      { messages: "{{item.messages}}" },
      { model: "gpt-5-mini" },
    )],
  );
  await createAndWaitForRun(evaluation, "customer-satisfaction-v1", {
    type: "jsonl",
    source: {
      type: "file_content",
      content: [{
        item: {
          messages: [
            { role: "user", content: "Turn this video transcript into key points, a study guide, and flashcards." },
            { role: "assistant", content: "## Key Points\n- Evaluation comes before optimization.\n- Route and compress context only when quality gates continue to pass.\n\n## Study Guide\nCompare a measured baseline with one controlled change at a time.\n\n## Flashcards\nQ: What validates an optimization?\nA: Re-running the same evaluation gates." },
            { role: "user", content: "This is exactly the format I needed. Thanks." },
            { role: "assistant", content: "You're welcome. The same format can be generated for any transcript you provide." },
          ],
        },
      }],
    },
  }, "conversation");
}

async function generateTraces(): Promise<void> {
  const prompts = [
    "Create Key Points, a Study Guide, and Q/A Flashcards from this transcript: Token cost is one input to complete solution cost. Business ROI is process value minus model, retrieval, platform, monitoring, and engineering costs, while quality and safety remain release gates.",
    "Create Key Points, a Study Guide, and Q/A Flashcards from this transcript: Route work to the smallest capable model, compress repeated context, retrieve relevant evidence, cache stable content, and simplify prompts, tools, and orchestration.",
    "Create Key Points, a Study Guide, and Q/A Flashcards from this transcript: Foundry tracing attributes latency and tokens to model, retrieval, and tool spans. Monitoring provides operational signals and Azure Cost Management provides authoritative billed spend.",
  ];
  for (const agentName of ["youtube-baseline-agent", "youtube-nano-agent", "youtube-router-agent"]) {
    const openai = project.getOpenAIClient({ azureConfig: { allowPreview: true, agentName } });
    for (const prompt of prompts) {
      await openai.responses.create({
        input: prompt,
        max_output_tokens: 400,
        metadata: { demo: "token-optimization", agent: agentName },
      });
    }
    console.log(`Generated trace traffic for ${agentName}.`);
  }
}

async function main(): Promise<void> {
  const rows = (await readFile(path.join(process.cwd(), "data", "youtube-transcript-evaluation.jsonl"), "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line) as EvaluationRow);

  await createAgentsAndToolbox();
  await createKnowledgeBase();
  await createModelEvaluation("gpt-5-mini", rows);
  await createModelEvaluation("gpt-5-nano", rows);
  await createModelEvaluation(modelRouterDeployment, rows);
  await createAgentProcessEvaluation();
  await createCustomerSatisfactionEvaluation();
  await generateTraces();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
