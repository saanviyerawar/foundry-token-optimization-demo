# 12–15 Minute Live Demo Runbook

This is the canonical slide-to-live-demo sequence:

**Tokenomics and ROI → evaluation-driven development → model routing → context compression → retrieval → caching → simplification → telemetry → agent tracing → spend metrics → wrap-up.**

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

## 0:00–1:30 — Tokenomics and business ROI (`/`)

- Define tokens as a variable input cost: input, output, retrieved context, tool definitions, and cached tokens.
- State the equation: **business ROI = business process value − solution costs**.
- Value is not token savings alone: include time saved, cycle time, avoided rework, and conversion.
- Costs include model tokens, retrieval, tools, observability, evaluation, and operations.
- State the goal: improve unit economics while preserving the business outcome and quality gate.

## 1:30–3:10 — Define the acceptance gate (`/evaluations`)

- Show the four-step creation rail and the seeded `evaluation-dataset.jsonl` mapping.
- Point out the three evaluator families: agent behavior, response quality, and safety.
- Run the dataset at threshold 3.7.
- State that every cost, latency, context, and caching optimization must preserve this release gate.

## 3:10–4:40 — Principle 1: model routing (`/route-requests`)

- Submit the default complex prompt with **Balanced** priority.
- Point out complexity, selected model, estimated cost, latency, throughput, and rationale.
- Change the prompt to `Classify this support request as billing, outage, or access.` and choose **Lowest latency**.
- Submit again and show the switch to `gpt-5-nano`.
- Explain that routing is an evaluated policy, not a model popularity contest.

## 4:40–6:10 — Principle 2: optimize and compress context (`/toolboxes`)

- Show the centered individual-definitions and CRM-toolbox comparison.
- Call out the input token reduction, 74% versus 94% selection accuracy, and estimated cost reduction.
- Switch the scenario between CRM and Knowledge to show progressive disclosure.
- Explain progressive disclosure: domain selection first, precise tool selection second.
- Position skills as another way to externalize specialized instructions where the target Foundry experience supports them; do not claim this repository provisions Foundry skills.

## 6:10–7:40 — Principle 3: retrieve content (`/knowledge`)

- Walk through name, description, answer model, reasoning effort, retrieval instructions, and source area.
- Run the default question.
- Show ranked chunk scores and the exact injected context.
- Read the source-attributed simulated answer.
- Optionally add a short local policy, rerun a matching query, and show that no path or file upload permission is exposed.
- Explain that Foundry IQ is the real-tenant extension; it remains a documented manual step rather than a simulated deployment claim.

## 7:40–8:50 — Principle 4: cache repeated work (`/telemetry`, cache comparison)

- Compare no cache, prompt-prefix cache, and response/semantic cache.
- Explain that prompt caching reuses stable prefixes while APIM plus Azure Managed Redis can serve equivalent responses without inference.
- Be explicit that APIM/Redis are optional production extensions and are not provisioned by the default deployment.

## 8:50–9:40 — Principle 5: simplify (`/toolboxes`, lower section)

- Compare the bloated prompt with the concise prompt.
- State the separation rule: durable behavior belongs in the system prompt, capabilities in toolboxes/skills, and business facts in retrieval.
- Connect simplification to fewer input tokens, fewer contradictions, and easier evaluation.

## 9:40–10:40 — Telemetry (`/telemetry`)

- Preview the cost guard with `npm run azure:load -- --count 5`.
- Generate controlled tenant traffic with `npm run azure:load -- --count 10 --rate 1 --concurrency 2 --execute`.
- Show the five headline cards, accumulated estimated-cost chart, and token, request, and time-to-first-byte charts.
- Explain how telemetry verifies whether routing, compression, retrieval, caching, and simplification changed the expected operating signals.

## 10:40–11:50 — Foundry agent tracing (`/traces`, then Foundry)

- Select a trace, move the time scrubber, and click nested `retrieval_call`, `mcp_tool_call`, and `chat_model_call` bars.
- Show nested timing, input/output, model, token counts, and metadata.
- Open the Foundry project’s **Agents → Traces** view and correlate a displayed trace ID.
- Explain that optimization requires attribution: which stage consumed time and tokens?

## 11:50–13:10 — Foundry spend metrics (`/telemetry`, Foundry, and Azure)

- Show total requests, input/output/total tokens, model mix, estimated cost, and accumulated cost.
- Use Foundry/Azure Monitor for real usage and failures, and Azure Cost Management for authoritative spend.
- State that the app's cost cards use illustrative rates and are not a billing source.

## 13:10–14:00 — Close the evaluation loop (`/evaluations`)

- Review the persisted aggregate ribbon and pass/fail rows from the opening run.
- Emphasize ToolSelection, ToolCallAccuracy, TaskCompletion, and Safety in addition to language quality.
- State: an optimization is complete only when it passes the required release gates.

## 14:00–15:00 — Wrap up (`/`)

- Return to the operating loop.
- Summarize: evaluate, route, compress, retrieve, cache, simplify, observe, repeat.
- Reconnect technical savings to business-process value and operational reliability.
- Remind the audience that each presenter can use mock mode as a deterministic fallback or deploy the same prompt agent and telemetry stack into their own tenant.

## After the session

```powershell
npm run azure:down -- -Force
```

State clearly that Foundry IQ and APIM/Redis semantic caching are optional manual extensions and were not provisioned by this demo.
