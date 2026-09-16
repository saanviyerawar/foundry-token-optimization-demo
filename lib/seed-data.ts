import { createRequest } from "./routing";
import type { AppData, KnowledgeDocument, RouteRequest, Trace } from "./types";

const knowledge: KnowledgeDocument[] = [
  {
    id: "token-budget-policy",
    title: "Token Budget Policy",
    createdAt: "2026-09-16T02:00:00.000Z",
    source: "seed",
    content: "# Token Budget Policy\n\nRoute simple classification and extraction requests to the smallest capable model. Escalate only when evaluation evidence shows a quality gap.\n\nUse a 1,200-token default context budget. Retrieval should inject at most three relevant chunks and preserve source attribution.\n\nPrompt-prefix caching is required for stable instructions longer than 500 tokens. Track cached input tokens separately from total input tokens.",
  },
  {
    id: "mcp-toolbox-standard",
    title: "MCP Toolbox Standard",
    createdAt: "2026-09-16T02:02:00.000Z",
    source: "seed",
    content: "# MCP Toolbox Standard\n\nExpose tools progressively by business domain instead of sending every tool schema with every turn. The agent first selects CRM, Knowledge, Productivity, Analytics, or Support.\n\nA toolbox should contain three to eight closely related tools. Evaluate both toolbox selection and final tool-call accuracy.",
  },
  {
    id: "evaluation-gates",
    title: "Evaluation Release Gates",
    createdAt: "2026-09-16T02:04:00.000Z",
    source: "seed",
    content: "# Evaluation Release Gates\n\nProduction candidates require aggregate scores of at least 3.7 out of 5 for relevance, groundedness, coherence, fluency, task completion, and safety.\n\nTool-enabled agents also require ToolSelection and ToolCallAccuracy. Any safety failure blocks release even when the aggregate passes.",
  },
  {
    id: "roi-playbook",
    title: "Agent ROI Playbook",
    createdAt: "2026-09-16T02:06:00.000Z",
    source: "seed",
    content: "# Agent ROI Playbook\n\nBusiness ROI equals business process value minus solution costs. Value includes time saved, cycle-time reduction, avoided rework, and increased conversion.\n\nSolution costs include model tokens, retrieval infrastructure, tool execution, observability, evaluation, and operational support. Optimize the end-to-end process, not model price in isolation.",
  },
];

export function makeTrace(request: RouteRequest, execution?: { output?: string; traceId?: string; provider?: string }): Trace {
  const start = new Date(request.createdAt).getTime();
  const duration = request.latencyMs;
  const span = (
    suffix: string,
    name: Trace["spans"][number]["name"],
    offset: number,
    durationMs: number,
    parentId?: string,
  ): Trace["spans"][number] => ({
    id: `${request.id}-${suffix}`,
    parentId,
    name,
    startedAt: new Date(start + offset).toISOString(),
    durationMs,
    model: name === "chat_model_call" || name === "response_generation" ? request.model : undefined,
    input: name === "retrieval_call" ? request.prompt : `Input for ${name}: ${request.prompt}`,
    output: name === "response_generation" && execution?.output
      ? execution.output
      : name === "mcp_tool_call" ? "Selected CRM toolbox and crm_search." : `Successful ${name} output.`,
    inputTokens: name === "chat_model_call" ? request.inputTokens : Math.round(request.inputTokens * 0.18),
    outputTokens: name === "response_generation" ? request.outputTokens : Math.round(request.outputTokens * 0.12),
    metadata: {
      simulation: !execution,
      cacheHit: request.cacheHit,
      status: request.status,
      ...(execution?.traceId ? { traceId: execution.traceId } : {}),
      ...(execution?.provider ? { provider: execution.provider } : {}),
    },
  });
  const rootId = `${request.id}-root`;
  const plannerId = `${request.id}-planner`;
  const toolboxId = `${request.id}-toolbox`;
  return {
    id: `trace-${request.id}`,
    requestId: request.id,
    createdAt: request.createdAt,
    status: request.status === "error" ? "error" : "success",
    spans: [
      span("root", "invoke_agent", 0, duration),
      span("policy-retrieval", "retrieval_call", Math.round(duration * 0.03), Math.round(duration * 0.08), rootId),
      span("customer-retrieval", "retrieval_call", Math.round(duration * 0.13), Math.round(duration * 0.09), rootId),
      span("planner", "chat_model_call", Math.round(duration * 0.24), Math.round(duration * 0.24), rootId),
      span("toolbox", "mcp_tool_call", Math.round(duration * 0.29), Math.round(duration * 0.08), plannerId),
      span("tool", "mcp_tool_call", Math.round(duration * 0.39), Math.round(duration * 0.12), toolboxId),
      span("result-retrieval", "retrieval_call", Math.round(duration * 0.53), Math.round(duration * 0.07), rootId),
      span("model", "chat_model_call", Math.round(duration * 0.63), Math.round(duration * 0.25), rootId),
      span("response", "response_generation", Math.round(duration * 0.90), Math.round(duration * 0.08), rootId),
    ],
  };
}

export function buildSeedData(): AppData {
  const prompts = [
    "Classify this support message and return JSON.",
    "Find the customer renewal policy and summarize the approval threshold.",
    "Compare three architecture options for a multi-region agent platform with detailed trade-offs.",
    "Use the CRM tools to find the Contoso opportunity and suggest the next milestone.",
    "Draft a concise follow-up email using the meeting notes.",
    "Analyze why token costs increased and propose an evaluation-driven optimization plan.",
    "Extract the invoice number, amount, and due date.",
    "Reason about the safety and compliance risks of this proposed workflow.",
    "Search policy documents for the default context budget.",
    "Create a chart-ready JSON summary of weekly request volume.",
    "Recommend the best model for a low-latency classification task.",
    "Develop an enterprise rollout strategy with cost, latency, and quality guardrails.",
  ];
  const priorities: RouteRequest["priority"][] = ["cost", "balanced", "quality", "latency"];
  const requests = Array.from({ length: 28 }, (_, index) =>
    createRequest(prompts[index % prompts.length], priorities[index % priorities.length], 101 + index),
  );
  return { requests, traces: requests.slice(0, 12).map((request) => makeTrace(request)), knowledge, evaluations: [] };
}
