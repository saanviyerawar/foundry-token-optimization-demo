# 12-15 Minute Foundry-only Live Demo Runbook

The Foundry portal is the only screen throughout this demo.

**Project → tokenomics → deployments → evaluations → toolboxes → knowledge → traces → monitoring → ROI**

See [`FOUNDRY-PORTAL-WALKTHROUGH.md`](FOUNDRY-PORTAL-WALKTHROUGH.md) for detailed presenter notes and fallback guidance.

## Tenant setup before the session

```powershell
git clone <your-fork-url>
cd foundry-token-optimization-demo
npm install
npm run azure:deploy -- -EnvironmentName demo -Location eastus2
```

Open `https://ai.azure.com` to the deployed project. Confirm four model deployments, the four YouTube learning agents, five completed evaluation runs, `youtube-learning-toolbox`, `token-optimization-knowledge`, the Application Insights connection, and one ingested trace.

## 0:00-1:30 - Orient in the Foundry project

- Start on the Foundry project overview, not the companion app.
- Identify the project endpoint, managed identity, and Application Insights connection.
- State the business frame: **ROI = business process value - complete solution cost**.
- Explain that token cost is one operating signal alongside quality, safety, latency, reliability, and process value.

## 1:30-2:40 - Inspect model deployments

- Open the model deployment list.
- Compare the deployed `gpt-5-mini`, `gpt-5-nano`, and `gpt-4.1-mini`.
- Explain that routing selects the smallest deployment that still satisfies evaluated quality, latency, and capacity requirements.
- Show `model-router` and explain that routing is measured against the same quality gate as direct models.

## 2:40-4:10 - Compare the agents

- Compare `youtube-baseline-agent`, `youtube-nano-agent`, and `youtube-router-agent`.
- Review their model choices and shared concise instructions.
- Run one representative prompt in the router-agent playground.
- Explain that durable behavior belongs in instructions while tools and knowledge should be attached intentionally.

## 4:10-5:40 - Establish the Foundry evaluation gate

- Open the seeded baseline, nano, and router evaluation runs.
- Show the common dataset mappings and coherence, relevance, and task-score evaluators.
- Compare quality results against latency and token cost.
- State that every optimization must continue to pass this gate.

Use `/evaluations` only if portal evaluation setup is unavailable.

## 5:40-7:10 - Show context optimization

- Open Toolboxes and select `youtube-learning-toolbox`.
- Explain progressive disclosure: expose the smallest relevant tool set instead of sending every schema on every turn.
- Connect this to the **Optimize context** and **Simplify** principles.

## 7:10-8:30 - Show retrieval

- Open Knowledge and select `token-optimization-knowledge`.
- Retrieve guidance for ROI, routing, or caching.
- Open `youtube-learning-knowledge-agent` and show its Foundry IQ connection.
- Explain that retrieval pays token cost only for relevant evidence.

## 8:30-10:20 - Inspect a real trace in Foundry

- Open the agent or project trace view and select a request generated during deployment.
- Expand the available orchestration, model, retrieval, and tool spans.
- Inspect duration, inputs, outputs, token counts, and failures.
- Correlate the run with Application Insights if deeper transaction details are useful.

Use `/traces` only when ingestion is delayed or as an offline explanation of span anatomy.

## 10:20-12:20 - Monitor operating signals

- Open Foundry monitoring and the connected Application Insights resource.
- Review request volume, latency, failures, and available token signals.
- Explain that Azure Cost Management is the authoritative spend source.
- Use input/output token and latency signals to discuss prompt caching and response caching.
- State that response caching normally uses APIM/Redis and is intentionally not claimed as part of this Foundry-only deployment.

## 12:20-15:00 - Close the ROI loop

- Return to the Foundry evaluation and monitoring views.
- Summarize: **evaluate → change → generate traffic → trace → monitor → evaluate again**.
- Reconnect model and token savings to quality, safety, reliability, and business-process value.
- Return to: **ROI = business process value - complete solution cost**.
- Close with: **evaluate → route/compress/retrieve/cache/simplify → trace → monitor → evaluate again**.

## After the session

```powershell
npm run azure:down -- -Force
```
