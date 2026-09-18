# 12-15 Minute Foundry-only Runbook

Use only `https://ai.azure.com`. Open the deployed project and confirm the models, agents, five completed evaluation runs, `youtube-learning-toolbox`, `token-optimization-knowledge`, and traces before presenting.

## 0:00-1:30 - Business frame

- Start on the project overview.
- Explain the YouTube transcript workload: Key Points, Study Guide, and Flashcards.
- State: **ROI = business-process value - complete solution cost**.
- Tokens are one input cost alongside retrieval, monitoring, platform, and engineering costs.

## 1:30-3:00 - Model routing

- Open Models.
- Compare `gpt-5-nano`, `gpt-5-mini`, `gpt-4.1-mini`, and `model-router`.
- Explain that the smallest capable model is preferred only when it continues to pass the evaluation gates.

## 3:00-5:30 - Evaluation-driven development

- Open Evaluations.
- Compare the mini, nano, and router quality/safety runs.
- Open the Agent and Tool Criteria run.
- Open the Customer Satisfaction conversation-level run.
- Explain why quality and safety failures block a release even when token cost improves.

## 5:30-7:00 - Context optimization and simplification

- Open `youtube-learning-toolbox`.
- Explain progressive disclosure instead of injecting every tool schema.
- Compare the concise shared instructions on the baseline, nano, and router agents.

## 7:00-8:30 - Foundry IQ retrieval

- Open `token-optimization-knowledge`.
- Retrieve guidance about ROI, evaluation, routing, caching, or tracing.
- Open `youtube-learning-knowledge-agent` and show its knowledge connection.

## 8:30-11:00 - Tracing and telemetry

- Open Tracing and inspect a seeded transcript-learning request.
- Identify model duration, input/output tokens, and any orchestration spans.
- Open Monitoring/Application Insights for request, latency, and failure signals.
- Explain that Azure Cost Management is authoritative for billed spend.

## 11:00-12:30 - Caching

- Use repeated prompt prefixes and token signals to explain prompt caching.
- Explain that production response caching normally uses APIM/Redis and is not falsely represented as deployed.

## 12:30-15:00 - Close

- Reconnect routing, context compression, retrieval, caching, and simplification to business ROI.
- Close with: **evaluate → optimize → trace → monitor → evaluate again**.
