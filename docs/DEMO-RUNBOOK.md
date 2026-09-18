# 12-15 Minute Portal-first Live Demo Runbook

The Foundry portal is the primary screen throughout this demo. The companion app appears only to generate repeatable requests or clarify an optimization trade-off.

**Project → deployments → agent → evaluation → workload → traces → monitoring → evaluation**

See [`FOUNDRY-PORTAL-WALKTHROUGH.md`](FOUNDRY-PORTAL-WALKTHROUGH.md) for detailed presenter notes and fallback guidance.

## Tenant setup before the session

```powershell
git clone <your-fork-url>
cd foundry-token-optimization-demo
npm install
azd auth login
azd env new demo --location eastus2
azd provision
npm run azure:env
npm run reset
npm run dev
```

Prepare two windows:

1. `https://ai.azure.com`, opened to the deployed Foundry project.
2. `http://localhost:3000?clawpilotTheme=dark`, or `AZURE_WEB_APP_URI`, as the companion.

Confirm the model deployments, `foundry-optimization-agent`, evaluation setup, Application Insights connection, and one ingested trace before presenting.

## 0:00-1:30 - Orient in the Foundry project

- Start on the Foundry project overview, not the companion app.
- Identify the project endpoint, managed identity, and Application Insights connection.
- State the business frame: **ROI = business process value - complete solution cost**.
- Explain that token cost is one operating signal alongside quality, safety, latency, reliability, and process value.

## 1:30-2:40 - Inspect model deployments

- Open the model deployment list.
- Compare the deployed `gpt-5-mini`, `gpt-5-nano`, and `gpt-4.1-mini`.
- Explain that routing selects the smallest deployment that still satisfies evaluated quality, latency, and capacity requirements.
- Mention the optional model router only if it is deployed in this tenant.

## 2:40-4:10 - Inspect and run the prompt agent

- Open `foundry-optimization-agent`.
- Review its model and concise instructions.
- Run the baseline prompt in the portal playground.
- Explain that durable behavior belongs in instructions while tools and knowledge should be attached intentionally.

## 4:10-5:40 - Establish the Foundry evaluation gate

- Open the evaluation experience.
- Show the dataset mapping and selected task, quality, tool, and safety evaluators available in the tenant.
- Run or open the baseline evaluation and explain the release threshold.
- State that every optimization must continue to pass this gate.

Use `/evaluations` only if portal evaluation setup is unavailable.

## 5:40-7:10 - Generate optimized traffic with the companion app

- Briefly switch to `/route-requests`.
- Submit the default complex prompt with **Balanced** priority.
- Submit `Classify this support request as billing, outage, or access.` with **Lowest latency**.
- Compare the selected deployments and copy a real-mode trace ID.
- Return to Foundry.

The application is a workload generator here, not the centre of the demo.

## 7:10-9:20 - Inspect the real trace in Foundry

- Open the agent or project trace view and locate the copied trace ID.
- Expand the available orchestration, model, retrieval, and tool spans.
- Inspect duration, inputs, outputs, token counts, and failures.
- Correlate the run with Application Insights if deeper transaction details are useful.

Use `/traces` only when ingestion is delayed or as an offline explanation of span anatomy.

## 9:20-11:20 - Monitor operating signals

- Open Foundry monitoring and the connected Application Insights resource.
- Review request volume, latency, failures, and available token signals.
- Explain that Azure Cost Management is the authoritative spend source.
- Optionally open `/telemetry` for an immediate comparison of routing and cache economics; label its cost figures as illustrative.

## 11:20-13:20 - Explain context optimization

Keep the Foundry agent configuration as the anchor and use companion pages only as visual aids:

- `/toolboxes`: progressive disclosure instead of injecting every tool schema.
- `/knowledge`: retrieving only relevant chunks instead of placing facts in the system prompt.
- `/telemetry`: prompt-prefix and response-cache economics.

State clearly that Foundry IQ and APIM/Redis semantic caching are optional tenant extensions and are not provisioned by the default deployment.

## 13:20-15:00 - Close the loop in Foundry

- Return to the Foundry evaluation and monitoring views.
- Summarize: **evaluate → change → generate traffic → trace → monitor → evaluate again**.
- Reconnect model and token savings to quality, safety, reliability, and business-process value.
- Mention mock mode only as a deterministic no-network fallback.

## After the session

```powershell
npm run azure:down -- -Force
```
