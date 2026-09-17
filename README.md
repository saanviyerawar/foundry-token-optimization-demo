# Foundry Agent Optimization Demo

A deployable Microsoft Foundry demonstration for model routing, MCP/toolbox compression, grounded retrieval, caching, tracing, telemetry, and evaluation-driven development.

The repository supports two modes:

- **Mock mode:** local, deterministic, no Azure resources or credentials.
- **Foundry mode:** tenant-owned Foundry resource and project, real model deployments, a real prompt agent, Application Insights, Log Analytics, managed identity, and an optional Azure App Service deployment.

![Foundry Agent Optimization Demo storyline](docs/images/storyline.png)

## Canonical slide storyline

Use this order for every city and presenter. The live app replaces static portal screenshots while preserving the source presentation's narrative.

| Stage | Core message | Live demonstration |
|---|---|---|
| **Tokenomics** | Tokens are a variable input cost, not the business outcome. Measure input, output, cached, and retrieved context tokens. | Start on `/` and frame tokens alongside latency, tools, retrieval, evaluation, and operations. |
| **Business ROI** | **ROI = business process value − solution costs.** Value includes time saved, faster cycle time, avoided rework, and conversion; costs include the complete agent solution. | Use the three opening cards to separate value, cost, and evidence. |
| **Evaluation-driven development** | Define quality, task, tool, and safety gates before optimizing. A cheaper run is not an improvement if it fails the gate. | Open `/evaluations`, review the mapped dataset and evaluators, set `3.7`, then select **Review and run**. |
| **1. Model routing** | Route each request to the smallest model that satisfies evaluated cost, latency, quality, and capacity requirements. | Open `/route-requests`, submit the default balanced request, then compare it with a low-latency classification request. |
| **2. Optimize/compress context** | Avoid injecting every MCP schema. Use toolboxes and progressive disclosure; keep skills or specialized instructions outside the always-on prompt where supported. | Open `/toolboxes` and compare individual definitions with the CRM toolbox. |
| **3. Retrieval** | Externalize business facts and retrieve only the relevant chunks. Foundry IQ is the production extension; the app exposes a transparent local retrieval teaching aid. | Open `/knowledge`, inspect the configured sources, run the default query, and show injected chunks and citations. |
| **4. Caching** | Prompt-prefix caching avoids recomputing stable prefixes. APIM plus Azure Managed Redis can cache equivalent responses and avoid inference. | Open `/telemetry`, scroll to the cache comparison, and contrast no cache, prefix cache, and response/semantic cache. |
| **5. Simplify** | Keep durable behavior in the system prompt, capabilities in toolboxes/skills, and facts in retrieval. Smaller, clearer context is easier to evaluate. | Return to the lower section of `/toolboxes` and compare the bloated and concise prompts. |
| **Telemetry** | Optimization must be observable end to end. | Generate controlled load and inspect request, token, latency, error, and cache signals. |
| **Foundry agent tracing** | Attribute time and tokens to orchestration, retrieval, model, and tool spans. | Open `/traces`, select nested spans, and correlate a real-mode trace ID with Foundry/Application Insights. |
| **Foundry spend metrics** | Use Foundry/Azure Cost Management for authoritative spend; use the app's estimate for the live optimization narrative. | Open `/telemetry` and explain total requests, input/output tokens, estimated cost, model mix, and accumulated cost. |
| **Wrap-up** | **Evaluate → route → compress → retrieve → cache → simplify → observe → repeat.** Tie technical savings back to process value. | Return to `/` and close on the operating loop. |

## Quick setup: local rehearsal

```powershell
git clone https://github.com/saanviyerawar/foundry-token-optimization-demo.git
cd foundry-token-optimization-demo
npm install
npm run reset
npm run dev
```

Open `http://localhost:3000?clawpilotTheme=dark`.

This deterministic mode is the recommended presenter rehearsal and fallback. It requires no cloud resources and still supports every live interaction in the storyline.

## Setup: deploy to a presenter's Azure tenant

> **Cost warning:** the deployment creates billable model capacity, Application Insights/Log Analytics, and by default a B1 App Service plan. Confirm regional model availability, quota, policy, and pricing before deployment.

### 1. Prerequisites

- Node.js 22+
- Azure CLI
- Azure Developer CLI (`azd`) 1.29+
- An Azure subscription where you can create resource groups and role assignments. Owner is simplest for a demo; Contributor alone cannot create RBAC assignments.
- Permission to deploy the selected Foundry models in the chosen region.

Confirm the intended tenant and subscription before creating anything:

```powershell
azd auth login
az login
az account show --query "{subscription:name, tenant:tenantId}" --output table
```

### 2. Clone and deploy

```powershell
git clone https://github.com/saanviyerawar/foundry-token-optimization-demo.git
cd foundry-token-optimization-demo
npm install
npm run azure:deploy -- -EnvironmentName demo -Location eastus2
```

The wrapper authenticates with `azd`, creates/selects the environment, runs `azd up`, creates or updates the demo prompt agent, and writes non-secret local settings to `.env.local`.

Equivalent direct `azd` path:

```powershell
azd auth login
azd env new demo --location eastus2
azd up
```

### 3. Rehearse against the deployed tenant

```powershell
# Run locally against your tenant
npm run azure:env
npm run reset
npm run dev

# Preview safe real-load settings without making billable calls
npm run azure:load -- --count 5

# Explicitly generate real traffic, capped at 50 requests and concurrency 3
npm run azure:load -- --count 10 --rate 1 --concurrency 2 --execute
```

Open `http://localhost:3000?clawpilotTheme=dark`, or use `azd env get-value AZURE_WEB_APP_URI` to open the deployed App Service.

### 4. Pre-demo checks

1. Open every route once and confirm the seeded data renders.
2. Run the evaluation and record the baseline result.
3. Submit one real routed request and copy its trace ID.
4. Confirm the trace appears in Foundry or Application Insights; ingestion can take several minutes.
5. Run only the controlled load needed for visible spend/telemetry.
6. Keep mock mode ready as the no-network fallback.

See [`docs/AZURE-DEPLOYMENT.md`](docs/AZURE-DEPLOYMENT.md) for tenant roles, model customization, validation, traces, troubleshooting, optional model router, and teardown.

## Demo screen references

These are screenshots of this repository's original interface. The supplied source slides informed the information hierarchy and sequence; raw portal screenshots are not redistributed because they contain tenant/resource details.

### Tokenomics, ROI, and evaluation-driven development

![Tokenomics, ROI, and operating storyline](docs/images/storyline.png)

![Evaluation-driven development](docs/images/evaluations.png)

### Five design principles

**1. Model routing**

![Model routing comparison and monitor signals](docs/images/route-requests.png)

**2. Optimize/compress context and 5. Simplify**

![MCP tool definitions compared with a focused toolbox](docs/images/toolboxes.png)

The lower section of the live page compares a bloated system prompt with a concise one and shows which content moves to toolboxes and retrieval.

**3. Retrieval**

![Knowledge source configuration and retrieval setup](docs/images/knowledge.png)

**4. Caching**

![Telemetry and caching control room](docs/images/telemetry.png)

### Telemetry, Foundry agent tracing, and spend

![Agent trace waterfall and selected span details](docs/images/traces.png)

![Request, token, cost, cache, and latency telemetry](docs/images/telemetry.png)

## What `azd up` automates

- Resource group
- `Microsoft.CognitiveServices/accounts` with `kind: AIServices`
- Foundry project child resource with managed identity
- Configurable direct model deployments for `gpt-5-mini`, `gpt-5-nano`, and `gpt-4.1-mini`
- Log Analytics workspace and workspace-based Application Insights
- Foundry account/project Application Insights connections for agent tracing
- Foundry User role assignments for the project identity, presenter identity when available, and web-app identity
- Linux App Service and plan, unless disabled
- Real runtime settings using managed identity and the Foundry project endpoint
- Idempotent prompt-agent creation/update

## Deliberately not claimed as automated

- **Foundry IQ knowledge source:** not provisioned. The app’s knowledge lab remains a transparent local BM25-like implementation. Configure Foundry IQ manually if your tenant has access.
- **APIM semantic caching or Azure Managed Redis:** not provisioned. The cache page demonstrates the economics and behavior; it does not claim a managed semantic cache exists.
- **Claude deployment:** not provisioned by default because regional availability, marketplace terms, and routing policy vary. The logical `claude-opus-5` route maps to `gpt-5-mini` until you configure an approved deployment.
- **Model router:** supported through a preview management API and therefore disabled by default. Enable it explicitly or use `npm run azure:router`.
- **Private networking, CMK, APIM, Redis, and Foundry IQ:** optional production architecture work, not hidden defaults.

## Runtime provider

`lib/provider.ts` implements:

- `MockProvider`
- `FoundryProvider` using `AIProjectClient`, the project Responses API, and `DefaultAzureCredential`
- `AzureOpenAIProvider` using Microsoft Entra ID by default, with an API-key fallback only when explicitly configured

Logical model IDs map to deployment names through server-only environment variables. Secrets are never sent to client components. Real API failures return explicit 502 responses rather than simulated success.

## Architecture

```text
Next.js App Router
  ├─ Interactive demo pages and local JSON telemetry
  ├─ /api/requests -> mock or real Foundry provider
  ├─ OpenTelemetry -> Application Insights when configured
  └─ Atomic JSON persistence (data/ locally, /home/data on App Service)

azd + Bicep
  ├─ Foundry AIServices account + project
  ├─ Direct model deployments
  ├─ Optional preview model router
  ├─ Application Insights + Log Analytics + project connections
  ├─ Least-scope Foundry/monitoring RBAC
  └─ Optional App Service deployment
```

Important paths:

- `azure.yaml`: azd application and lifecycle hooks.
- `infra/main.bicep`, `infra/resources.bicep`: tenant infrastructure.
- `scripts/deploy.ps1`: presenter deployment wrapper.
- `scripts/create-agent.ts`: idempotent Foundry prompt-agent setup.
- `scripts/load-real.ts`: guarded real traffic generation.
- `lib/provider.ts`: real/mock provider abstraction.
- `lib/azure-monitor.ts`: server-only, lazy Azure Monitor OpenTelemetry initialization before real calls.
- `docs/DEMO-RUNBOOK.md`: presenter sequence.
- `docs/SCREENSHOT-GUIDE.md`: reproducible visual states.

## Validation

```powershell
npm run azure:validate
az bicep lint --file infra/main.bicep
az bicep build --file infra/main.bicep
npm test
npm run lint
npm run build
```

CI runs all credential-free checks. A tenant what-if is intentionally separate because it needs Azure authentication and a target subscription.

## Official Microsoft references

- [Deploy a Foundry resource with Bicep](https://learn.microsoft.com/azure/foundry/how-to/create-resource-template)
- [Official Foundry Bicep samples](https://github.com/microsoft-foundry/foundry-samples/tree/main/infrastructure/infrastructure-setup-bicep)
- [Foundry SDKs and project endpoints](https://learn.microsoft.com/azure/foundry/how-to/develop/sdk-overview)
- [Create a prompt agent with the TypeScript SDK](https://learn.microsoft.com/azure/foundry/agents/quickstarts/prompt-agent)
- [Foundry role-based access control](https://learn.microsoft.com/azure/foundry/concepts/rbac-foundry)
- [Model router deployment and usage](https://learn.microsoft.com/azure/foundry/openai/how-to/model-router)
- [Set up Foundry agent tracing](https://learn.microsoft.com/azure/foundry/observability/how-to/trace-agent-setup)
- [Azure Monitor OpenTelemetry for Node.js](https://learn.microsoft.com/azure/azure-monitor/app/opentelemetry-enable?tabs=nodejs)
- [Azure Developer CLI `azure.yaml` schema](https://learn.microsoft.com/azure/developer/azure-developer-cli/azd-schema)

## Clean reset and teardown

```powershell
# Reset only local demo data
npm run reset

# Delete the selected azd environment's Azure resource group
npm run azure:down -- -Force
```
