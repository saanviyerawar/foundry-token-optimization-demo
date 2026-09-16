export type ModelId = "gpt-5-nano" | "gpt-5-mini" | "gpt-4.1-mini" | "claude-opus-5";

export interface RouteRequest {
  id: string;
  createdAt: string;
  prompt: string;
  priority: "cost" | "latency" | "quality" | "balanced";
  complexity: number;
  model: ModelId;
  rationale: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  status: "success" | "throttled" | "error";
  tokensPerSecond: number;
  cacheHit: boolean;
  estimatedCost: number;
  provider?: string;
  responseModel?: string;
  responsePreview?: string;
  traceId?: string;
}

export interface Span {
  id: string;
  parentId?: string;
  name: "invoke_agent" | "chat_model_call" | "mcp_tool_call" | "retrieval_call" | "response_generation";
  startedAt: string;
  durationMs: number;
  model?: ModelId;
  input: string;
  output: string;
  inputTokens: number;
  outputTokens: number;
  metadata: Record<string, string | number | boolean>;
}

export interface Trace {
  id: string;
  requestId: string;
  createdAt: string;
  status: "success" | "error";
  spans: Span[];
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  source: "seed" | "user";
}

export interface EvaluationRow {
  id: string;
  input: string;
  expected: string;
  answer: string;
  scores: Record<EvaluatorName, number>;
  passed: boolean;
}

export type EvaluatorName =
  | "Relevance"
  | "Groundedness"
  | "Coherence"
  | "Fluency"
  | "ToolSelection"
  | "ToolCallAccuracy"
  | "TaskCompletion"
  | "Safety";

export interface EvaluationRun {
  id: string;
  createdAt: string;
  threshold: number;
  rows: EvaluationRow[];
  aggregates: Record<EvaluatorName, number>;
}

export interface AppData {
  requests: RouteRequest[];
  traces: Trace[];
  knowledge: KnowledgeDocument[];
  evaluations: EvaluationRun[];
}

export interface TelemetrySummary {
  totalRequests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  cacheSavings: number;
  averageLatency: number;
  byModel: Array<{ model: ModelId; requests: number; tokens: number; cost: number; latency: number }>;
  overTime: Array<{ time: string; requests: number; tokens: number; latency: number; cost: number; timeToFirstByte: number }>;
}
