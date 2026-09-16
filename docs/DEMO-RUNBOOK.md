# 12–15 Minute Live Demo Runbook

## Tenant setup before the session

```powershell
git clone <your-fork-url>
cd foundry-token-optimization-demo
npm install
azd auth login
azd env new demo --location eastus2
azd up
```

`azd up` provisions Foundry, the project, three direct model deployments, monitoring, RBAC, the web app, and the prompt agent. If a default model is unavailable, update `modelDeployments` in `infra/main.bicep` and rerun provisioning.

For local presentation against the deployed tenant:

```powershell
npm run azure:env
npm run reset
npm run dev
```

Open `http://localhost:3000?clawpilotTheme=dark`. To use the deployed App Service instead, open the `AZURE_WEB_APP_URI` value from `azd env get-values`.

## 0:00–1:30 — Frame the economics (`/`)

- State the equation: **business ROI = business process value − solution costs**.
- Value is not token savings alone: include time saved, cycle time, avoided rework, and conversion.
- Costs include model tokens, retrieval, tools, observability, evaluation, and operations.
- Introduce the operating loop and five optimization principles.

## 1:30–3:10 — Define the acceptance gate (`/evaluations`)

- Show the four-step creation rail and the seeded `evaluation-dataset.jsonl` mapping.
- Point out the three evaluator families: agent behavior, response quality, and safety.
- Run the dataset at threshold 3.7.
- State that every cost, latency, context, and caching optimization must preserve this release gate.

## 3:10–5:00 — Route requests (`/route-requests`)

- Submit the default complex prompt with **Balanced** priority.
- Point out complexity, selected model, estimated cost, latency, throughput, and rationale.
- Change the prompt to `Classify this support request as billing, outage, or access.` and choose **Lowest latency**.
- Submit again and show the switch to `gpt-5-nano`.
- Explain that routing is an evaluated policy, not a model popularity contest.

## 5:00–6:35 — Externalise and compress tools (`/toolboxes`)

- Show the centered individual-definitions and CRM-toolbox comparison.
- Call out the input token reduction, 74% versus 94% selection accuracy, and estimated cost reduction.
- Switch the scenario between CRM and Knowledge to show progressive disclosure.
- Explain progressive disclosure: domain selection first, precise tool selection second.

## 6:35–7:25 — Simplify (`/toolboxes`, lower section)

- Compare the bloated prompt with the concise prompt.
- State the separation rule: durable behavior belongs in the system prompt, capabilities in toolboxes, business facts in knowledge.
- Connect simplification to lower input tokens, fewer contradictions, and easier evaluation.

## 7:25–9:00 — Configure and retrieve knowledge (`/knowledge`)

- Walk through name, description, answer model, reasoning effort, retrieval instructions, and source area.
- Run the default question.
- Show ranked chunk scores and the exact injected context.
- Read the source-attributed simulated answer.
- Optionally add a short local policy, rerun a matching query, and show that no path or file upload permission is exposed.

## 9:00–10:30 — Inspect traces (`/traces`)

- Select a trace, move the time scrubber, and click nested `retrieval_call`, `mcp_tool_call`, and `chat_model_call` bars.
- Show nested timing, input/output, model, token counts, and metadata.
- Explain that optimization requires attribution: which stage consumed time and tokens?

## 10:30–12:35 — Telemetry and caching (`/telemetry`)

- Preview the cost guard with `npm run azure:load -- --count 5`.
- Generate controlled tenant traffic with `npm run azure:load -- --count 10 --rate 1 --concurrency 2 --execute`.
- Show the five headline cards, accumulated estimated-cost chart, and token, request, and time-to-first-byte charts.
- Open the Foundry project’s **Agents → Traces** view and correlate a displayed trace ID.
- Use Azure Monitor/Application Insights for real latency and failures, and Azure Cost Management for authoritative spend.
- Compare no cache, prompt-prefix cache, and response/semantic cache.
- Explain that prefix caching helps stable instructions while semantic caching avoids inference for equivalent requests.

## 12:35–13:35 — Close the evaluation loop (`/evaluations`)

- Review the persisted aggregate ribbon and pass/fail rows from the opening run.
- Emphasize ToolSelection, ToolCallAccuracy, TaskCompletion, and Safety in addition to language quality.
- State: an optimization is complete only when it passes the required release gates.

## 13:35–15:00 — Close (`/`)

- Return to the operating loop.
- Summarize: route, compress, retrieve, cache, simplify, observe, evaluate, repeat.
- Reconnect technical savings to business-process value and operational reliability.
- Mention that `AIProvider` allows a later Azure OpenAI / Foundry integration without changing the demo architecture.

## After the session

```powershell
npm run azure:down -- -Force
```

State clearly that Foundry IQ and APIM/Redis semantic caching are optional manual extensions and were not provisioned by this demo.
