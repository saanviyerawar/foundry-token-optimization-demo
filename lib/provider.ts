import { AIProjectClient } from "@azure/ai-projects";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { AzureOpenAI } from "openai";
import { ensureAzureMonitor } from "./azure-monitor";
import type { ModelId } from "./types";

export interface CompletionInput {
  model: ModelId;
  systemPrompt: string;
  userPrompt: string;
  context?: string;
}

export interface CompletionResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  provider: "mock" | "foundry" | "foundry-agent" | "azure-openai";
  responseModel: string;
  traceId?: string;
}

export interface AIProvider {
  complete(input: CompletionInput): Promise<CompletionResult>;
}

export type ProviderMode = "mock" | "foundry" | "azure";

export interface ProviderConfig {
  mode: ProviderMode;
  foundryProjectEndpoint?: string;
  foundryAgentName?: string;
  useAgent: boolean;
  azureOpenAIEndpoint?: string;
  azureOpenAIApiKey?: string;
  azureOpenAIApiVersion: string;
  deployments: Record<ModelId, string>;
}

export class ProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigurationError";
  }
}

export class ProviderRequestError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ProviderRequestError";
  }
}

function parseBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === "true";
}

export function resolveProviderConfig(env: NodeJS.ProcessEnv = process.env): ProviderConfig {
  const modeValue = (env.AI_PROVIDER ?? "mock").toLowerCase();
  if (!["mock", "foundry", "azure"].includes(modeValue)) {
    throw new ProviderConfigurationError(`AI_PROVIDER must be mock, foundry, or azure; received "${modeValue}".`);
  }
  const gpt5Mini = env.MODEL_DEPLOYMENT_GPT_5_MINI ?? env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-5-mini";
  return {
    mode: modeValue as ProviderMode,
    foundryProjectEndpoint: env.FOUNDRY_PROJECT_ENDPOINT,
    foundryAgentName: env.FOUNDRY_AGENT_NAME,
    useAgent: parseBoolean(env.FOUNDRY_USE_AGENT),
    azureOpenAIEndpoint: env.AZURE_OPENAI_ENDPOINT,
    azureOpenAIApiKey: env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiVersion: env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview",
    deployments: {
      "gpt-5-nano": env.MODEL_DEPLOYMENT_GPT_5_NANO ?? "gpt-5-nano",
      "gpt-5-mini": gpt5Mini,
      "gpt-4.1-mini": env.MODEL_DEPLOYMENT_GPT_4_1_MINI ?? "gpt-4-1-mini",
      "claude-opus-5": env.MODEL_DEPLOYMENT_CLAUDE_OPUS_5 ?? gpt5Mini,
    },
  };
}

export function mapModelToDeployment(model: ModelId, config: ProviderConfig): string {
  const deployment = config.deployments[model]?.trim();
  if (!deployment) throw new ProviderConfigurationError(`No Azure deployment is configured for logical model "${model}".`);
  return deployment;
}

function combinedInput(input: CompletionInput): string {
  return input.context ? `${input.userPrompt}\n\nGrounding context:\n${input.context}` : input.userPrompt;
}

async function tracedCompletion(
  provider: CompletionResult["provider"],
  model: string,
  operation: () => Promise<{ text: string; inputTokens: number; outputTokens: number; responseModel: string }>,
): Promise<CompletionResult> {
  await ensureAzureMonitor();
  const tracer = trace.getTracer("foundry-agent-optimization-demo");
  return tracer.startActiveSpan("ai.completion", {
    attributes: {
      "gen_ai.operation.name": "responses.create",
      "gen_ai.request.model": model,
      "server.address": provider,
    },
  }, async (span) => {
    const started = performance.now();
    try {
      const result = await operation();
      span.setAttributes({
        "gen_ai.response.model": result.responseModel,
        "gen_ai.usage.input_tokens": result.inputTokens,
        "gen_ai.usage.output_tokens": result.outputTokens,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      return {
        ...result,
        latencyMs: Math.round(performance.now() - started),
        provider,
        traceId: span.spanContext().traceId,
      };
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw new ProviderRequestError(`${provider} completion failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    } finally {
      span.end();
    }
  });
}

export class MockProvider implements AIProvider {
  async complete(input: CompletionInput): Promise<CompletionResult> {
    return {
      text: `Simulated ${input.model} response grounded in the supplied controlled context.`,
      inputTokens: Math.ceil((input.systemPrompt.length + input.userPrompt.length + (input.context?.length ?? 0)) / 4),
      outputTokens: 96,
      latencyMs: 640,
      provider: "mock",
      responseModel: input.model,
      traceId: trace.getSpan(context.active())?.spanContext().traceId,
    };
  }
}

export class FoundryProvider implements AIProvider {
  constructor(private readonly config: ProviderConfig) {
    if (!config.foundryProjectEndpoint) {
      throw new ProviderConfigurationError("FOUNDRY_PROJECT_ENDPOINT is required when AI_PROVIDER=foundry.");
    }
    if (config.useAgent && !config.foundryAgentName) {
      throw new ProviderConfigurationError("FOUNDRY_AGENT_NAME is required when FOUNDRY_USE_AGENT=true.");
    }
  }

  async complete(input: CompletionInput): Promise<CompletionResult> {
    const deployment = mapModelToDeployment(input.model, this.config);
    const project = new AIProjectClient(this.config.foundryProjectEndpoint!, new DefaultAzureCredential());
    const provider = this.config.useAgent ? "foundry-agent" : "foundry";
    const openai = this.config.useAgent
      ? project.getOpenAIClient({ azureConfig: { allowPreview: true, agentName: this.config.foundryAgentName! } })
      : project.getOpenAIClient();
    return tracedCompletion(provider, deployment, async () => {
      const response = await openai.responses.create({
        ...(this.config.useAgent ? {} : { model: deployment }),
        instructions: input.systemPrompt,
        input: combinedInput(input),
        max_output_tokens: 800,
        metadata: { logical_model: input.model, demo: "foundry-agent-optimization" },
      });
      return {
        text: response.output_text,
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        responseModel: String(response.model ?? deployment),
      };
    });
  }
}

export class AzureOpenAIProvider implements AIProvider {
  constructor(private readonly config: ProviderConfig) {
    if (!config.azureOpenAIEndpoint) {
      throw new ProviderConfigurationError("AZURE_OPENAI_ENDPOINT is required when AI_PROVIDER=azure.");
    }
  }

  async complete(input: CompletionInput): Promise<CompletionResult> {
    const deployment = mapModelToDeployment(input.model, this.config);
    const credential = new DefaultAzureCredential();
    const client = new AzureOpenAI({
      endpoint: this.config.azureOpenAIEndpoint,
      apiVersion: this.config.azureOpenAIApiVersion,
      deployment,
      ...(this.config.azureOpenAIApiKey
        ? { apiKey: this.config.azureOpenAIApiKey }
        : { azureADTokenProvider: getBearerTokenProvider(credential, "https://cognitiveservices.azure.com/.default") }),
      maxRetries: 2,
      timeout: 60_000,
    });
    return tracedCompletion("azure-openai", deployment, async () => {
      const response = await client.responses.create({
        model: deployment,
        instructions: input.systemPrompt,
        input: combinedInput(input),
        max_output_tokens: 800,
        metadata: { logical_model: input.model, demo: "foundry-agent-optimization" },
      });
      return {
        text: response.output_text,
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
        responseModel: String(response.model ?? deployment),
      };
    });
  }
}

export function getProvider(config = resolveProviderConfig()): AIProvider {
  if (config.mode === "foundry") return new FoundryProvider(config);
  if (config.mode === "azure") return new AzureOpenAIProvider(config);
  return new MockProvider();
}
