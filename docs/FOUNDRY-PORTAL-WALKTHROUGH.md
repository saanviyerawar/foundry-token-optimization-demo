# Microsoft Foundry Portal Walkthrough

This is the canonical live-demo path. Microsoft Foundry is the primary presentation surface; the repository's Next.js application is a companion for repeatable workload generation, transparent optimization comparisons, and offline fallback.

Use `npm run azure:deploy` for the direct portal demo. Use `npm run azure:deploy:companion` when the same session also needs a hosted companion application.

Portal labels can change as Microsoft Foundry evolves. Follow the equivalent project, build, evaluation, tracing, and monitoring views if your tenant uses updated navigation.

## Presentation layout

Use two windows:

1. **Primary:** `https://ai.azure.com`, opened to the deployed Foundry project.
2. **Companion:** the local app or `AZURE_WEB_APP_URI`, opened only when a step calls for generated traffic or a supporting comparison.

Before the audience joins:

1. Confirm the correct tenant, subscription, and Foundry project.
2. Confirm the project endpoint and Application Insights connection.
3. Confirm the three model deployments are healthy.
4. Open `foundry-optimization-agent` and run one non-sensitive baseline prompt.
5. Generate one request from the companion app and wait for its trace to appear.
6. Prepare the evaluation dataset and evaluator selection in the portal.
7. Keep mock mode open as a fallback, but do not lead with it.

## 1. Orient in the Foundry project

Start on the project overview.

- Identify the project and resource names.
- Show the project endpoint used by the SDK.
- Point out managed identity and the connected Application Insights resource.
- Explain that the repository provisioned this tenant-owned environment directly; the demo is not calling a shared hidden service.

Message: the repository has provisioned a runnable demo directly in Foundry; the application is not required to start the agent experience.

## 2. Inspect model deployments

Open the project's model deployment view.

- Compare `gpt-5-mini`, `gpt-5-nano`, and `gpt-4.1-mini`.
- Explain that model choice affects capability, latency, capacity, and token economics.
- If the optional model router is deployed, show it as an evaluated routing option rather than claiming it is enabled by default.
- State that the logical Claude route maps to an approved fallback unless the presenter separately deployed Claude.

Do not spend time comparing catalog marketing pages. Keep the discussion tied to deployments available to this project.

## 3. Open the prompt agent

Open `foundry-optimization-agent`.

- Review the selected model and concise instructions.
- Show where tools or knowledge connections would be attached in a production implementation.
- Run the baseline prompt in the playground.
- Keep the response and run details available for comparison.

Message: durable behavior belongs in agent instructions; capabilities and facts should be attached deliberately instead of copied into every prompt.

## 4. Establish the evaluation gate

Open the Foundry evaluation experience.

- Select the agent or model target.
- Map the prepared dataset fields.
- Select the available task, quality, tool, and safety evaluators that match the scenario.
- Set and explain the release threshold.
- Run or open the baseline result.

Message: a cheaper or faster run is not an improvement unless it still passes the required quality and safety gates.

If tenant capabilities or evaluator names differ, use the closest supported evaluators and state the substitution. Use `/evaluations` only as the deterministic fallback.

## 5. Generate controlled optimized traffic

Move briefly to the companion app.

1. Open `/route-requests`.
2. Submit the default complex prompt with **Balanced** priority.
3. Submit `Classify this support request as billing, outage, or access.` with **Lowest latency**.
4. Copy a real-mode trace ID.

For a larger monitoring sample:

```powershell
npm run azure:load -- --count 10 --rate 1 --concurrency 2 --execute
```

The app is performing a supporting role here: it generates consistent traffic and makes the routing policy easy to compare. Return to Foundry after the requests complete.

## 6. Inspect traces in Foundry

Open the agent or project trace view and search for the copied trace ID.

- Inspect the end-to-end duration.
- Expand model, orchestration, retrieval, and tool spans that are present.
- Compare input and output token usage.
- Identify latency or failure hotspots.
- Correlate the trace with Application Insights when deeper transaction details are useful.

Message: optimization requires attribution. A total-duration chart cannot show which stage consumed the time or context.

Use `/traces` only to explain span anatomy when portal ingestion is delayed or connectivity is unavailable.

## 7. Review monitoring and cost signals

Open Foundry monitoring and the connected Application Insights resource.

- Review request volume, latency, failures, and token-related signals available in the tenant.
- Compare the baseline traffic with the optimized requests.
- Use Azure Cost Management for authoritative spend.
- Clearly label the companion app's cost estimates as illustrative rates, not billing data.

Move to `/telemetry` only when an immediate side-by-side visualization helps explain routing or caching economics.

## 8. Explain context optimization

Use the portal agent configuration as the anchor, then use the companion pages selectively:

- `/toolboxes`: compare all tool schemas with progressive toolbox disclosure.
- `/knowledge`: show exactly which local chunks enter context.
- `/telemetry`: compare no cache, prompt-prefix cache, and response-cache behavior.

Be explicit about implementation boundaries:

- Foundry IQ is not provisioned by default.
- APIM semantic caching and Azure Managed Redis are not provisioned by default.
- The local retrieval and caching views teach the design trade-offs; they are not evidence that those managed services exist in the tenant.

## 9. Close in Foundry

Return to the evaluation and monitoring views.

Summarize the operating loop:

**Evaluate → change routing or context → generate traffic → inspect traces → monitor cost and latency → evaluate again.**

Close on the business outcome: token reduction matters only when the agent preserves quality, safety, reliability, and process value.

## Fallback hierarchy

1. Use the live Foundry project and real tenant traffic.
2. If trace ingestion is delayed, use the portal for configuration and the app's trace visual for span explanation.
3. If tenant connectivity fails, switch to mock mode and state clearly that it is a deterministic rehearsal of the same workflow.

Never present mock telemetry, local retrieval, or illustrative cost estimates as tenant-generated Foundry evidence.
