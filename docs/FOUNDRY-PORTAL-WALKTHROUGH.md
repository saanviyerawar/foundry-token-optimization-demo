# Microsoft Foundry Portal Walkthrough

This is the canonical live-demo path. Microsoft Foundry is the only presentation surface; the repository's Next.js application is an offline fallback.

Use `npm run azure:deploy` for the direct portal demo. Use `npm run azure:deploy:companion` when the same session also needs a hosted companion application.

Portal labels can change as Microsoft Foundry evolves. Follow the equivalent project, build, evaluation, tracing, and monitoring views if your tenant uses updated navigation.

## Presentation layout

Use one window: `https://ai.azure.com`, opened to the deployed Foundry project.

Before the audience joins:

1. Confirm the correct tenant, subscription, and Foundry project.
2. Confirm the project endpoint and Application Insights connection.
3. Confirm the three model deployments are healthy.
4. Confirm the four seeded agents, three evaluations, toolbox, and knowledge base.
5. Confirm at least one seeded trace is visible.
6. Keep mock mode available only as a no-network fallback.

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
- Show `model-router` as the evaluated routing option created by the default deployment.
- State that the logical Claude route maps to an approved fallback unless the presenter separately deployed Claude.

Do not spend time comparing catalog marketing pages. Keep the discussion tied to deployments available to this project.

## 3. Open the prompt agent

Compare `youtube-baseline-agent`, `youtube-nano-agent`, `youtube-router-agent`, and `youtube-learning-knowledge-agent`.

- Review the selected model and concise instructions.
- Show where tools or knowledge connections would be attached in a production implementation.
- Run the baseline prompt in the playground.
- Keep the response and run details available for comparison.

Message: durable behavior belongs in agent instructions; capabilities and facts should be attached deliberately instead of copied into every prompt.

## 4. Establish the evaluation gate

Open the seeded `Token Optimization` evaluations for baseline, nano, and router targets.

- Select the agent or model target.
- Map the prepared dataset fields.
- Select the available task, quality, tool, and safety evaluators that match the scenario.
- Set and explain the release threshold.
- Run or open the baseline result.

Message: a cheaper or faster run is not an improvement unless it still passes the required quality and safety gates.

If tenant capabilities or evaluator names differ, use the closest supported evaluators and state the substitution. Use `/evaluations` only as the deterministic fallback.

## 5. Inspect Toolboxes and Foundry IQ

- Open Toolboxes and select `youtube-learning-toolbox`.
- Explain that a focused toolbox reduces tool-schema context while preserving discoverability.
- Open Knowledge and select `token-optimization-knowledge`.
- Run a retrieval query about ROI, routing, caching, or evaluation-driven development.
- Open `youtube-learning-knowledge-agent` to show how the knowledge base is attached through the project connection.

## 6. Inspect traces in Foundry

Open the agent or project trace view and inspect one of the requests generated during deployment.

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

Use the portal assets as the evidence:

- Toolboxes demonstrate progressive disclosure instead of injecting every tool schema.
- Foundry IQ demonstrates retrieving only relevant knowledge instead of placing all facts in every prompt.
- Agent instructions demonstrate simplification and durable prompt-prefix reuse.
- Monitoring token and latency signals provide the bridge to caching economics.

Be explicit that APIM semantic caching and Azure Managed Redis are not provisioned. Prompt caching is a model behavior; production response caching requires a separate cache layer.

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
