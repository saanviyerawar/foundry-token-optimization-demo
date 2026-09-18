# Portal-first Foundry Agent Optimization Demo

A portal-first Microsoft Foundry walkthrough that uses a YouTube learning bot to demonstrate model routing, toolbox compression, grounded retrieval, caching, tracing, telemetry, and evaluation-driven development. The bot turns transcript text into key points, a study guide, and flashcards.

The live presentation stays in the Microsoft Foundry portal. The default deployment seeds the project with models, agents, evaluations, a toolbox, Foundry IQ knowledge, traces, and monitoring connections. The included Next.js application remains an optional rehearsal and fallback surface.

The repository supports two modes:

- **Direct Foundry demo:** tenant-owned Foundry resource and project, direct models plus Model Router, four runnable agents, completed evaluation runs, a toolbox, Foundry IQ knowledge backed by Azure AI Search, trace-generating requests, Application Insights, Log Analytics, and managed identity.
- **Foundry + companion app demo:** the same Foundry deployment plus a local or App Service-hosted workload generator and visualization surface.
- **Mock fallback:** local and deterministic, with no Azure resources or credentials.

![Foundry Agent Optimization Demo storyline](docs/images/storyline.png)

## Canonical portal-first storyline

Use this order for every city and presenter. Keep the Foundry project open throughout; the deployment has already created the assets and traffic needed for the walkthrough.

| Stage | Foundry portal walkthrough | Companion app role |
|---|---|---|
| **Project orientation** | Open the deployed Foundry project and identify the project endpoint, connected Application Insights resource, and managed identity. | Keep `/` available as the business ROI and optimization-loop visual. |
| **Models and deployments** | Compare `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1-mini`, and `model-router`. | Optional fallback only. |
| **Agent configuration** | Compare the baseline, nano, router, and knowledge agents, then run one in the playground. | Optional fallback only. |
| **Evaluation gate** | Open the seeded baseline, nano, and router evaluations and compare completed runs. | `/evaluations` is the offline fallback. |
| **Context and retrieval** | Open Toolboxes and Foundry IQ Knowledge to show progressive tool disclosure and grounded retrieval. | `/toolboxes` and `/knowledge` are offline fallbacks. |
| **Tracing** | Open the trace view and inspect the seeded agent requests. | `/traces` explains span anatomy if ingestion is delayed. |
| **Monitoring and spend** | Review Foundry/Application Insights monitoring for request volume, latency, failures, and token usage; use Azure Cost Management for authoritative spend. | `/telemetry` provides an immediate optimization comparison using illustrative cost estimates. |
| **Caching and simplification** | Use token and latency signals to explain prompt caching, response caching, and removing unnecessary context or orchestration. | `/telemetry` remains a fallback comparison; APIM/Redis response caching is not provisioned. |
| **Close the loop** | Return to the Foundry evaluation and monitoring views: **evaluate → change → generate traffic → trace → monitor → evaluate again**. | Use `/` only as the closing summary visual. |

See [`docs/FOUNDRY-PORTAL-WALKTHROUGH.md`](docs/FOUNDRY-PORTAL-WALKTHROUGH.md) for the detailed portal navigation and [`docs/DEMO-RUNBOOK.md`](docs/DEMO-RUNBOOK.md) for the timed presenter script.

## Quick setup: local rehearsal

```powershell
git clone https://github.com/saanviyerawar/foundry-token-optimization-demo.git
cd foundry-token-optimization-demo
npm install
npm run reset
npm run dev
```

Open `http://localhost:3000?clawpilotTheme=dark`.

This deterministic mode is the recommended rehearsal and fallback. It demonstrates the optimization concepts, but it is not the canonical portal-first presentation.

## Choose a deployment path

> **Cost warning:** the deployment creates billable model capacity, Model Router, Azure AI Search Basic, Application Insights, and Log Analytics, then makes real model/evaluation calls. App Service is optional. Confirm regional availability, quota, policy, and pricing before deployment.

### Prerequisites

- Node.js 22 LTS (the repository includes `.nvmrc`)
- Azure CLI
- Azure Developer CLI (`azd`) 1.29+
- An Azure subscription where you can create resource groups and role assignments. Owner is simplest for a demo; Contributor alone cannot create RBAC assignments.
- Permission to deploy the selected Foundry models in the chosen region.

Confirm the intended tenant and subscription before creating anything:

```powershell
az login
az account show --query "{subscription:name, tenant:tenantId}" --output table
```

### Option A: direct Foundry portal demo

```powershell
git clone https://github.com/saanviyerawar/foundry-token-optimization-demo.git
cd foundry-token-optimization-demo
npm install
npm run azure:deploy -- -EnvironmentName demo -Location eastus2
```

The wrapper uses the active Azure CLI subscription, authenticates `azd` to the same tenant, checks deployment and RBAC permissions, and binds the selected subscription. It provisions the complete portal demo, seeds its assets and data, writes non-secret local settings to `.env.local`, and prints the Foundry portal handoff. Pass `-SkipPortalDemoAssets` only when you want infrastructure without Model Router, Foundry IQ, toolbox/evaluation seeding, or generated trace traffic. The default command does not deploy App Service.

Equivalent direct portal-first path:

```powershell
az login
azd auth login --tenant-id (az account show --query tenantId --output tsv)
azd env new demo --location eastus2 --subscription (az account show --query id --output tsv)
azd provision
```

After provisioning, open `https://ai.azure.com` and select the printed project. The Models, Agents, Evaluations, Toolboxes, Knowledge, Tracing, and Monitoring screens are ready to present.

### Option B: Foundry plus hosted companion app

Provision the same runnable Foundry demo and deploy the companion to App Service:

```powershell
npm run azure:deploy:companion -- -EnvironmentName demo -Location eastus2
```

### Option C: Foundry plus local companion app

Start with Option A, then run the companion locally against the deployed Foundry agent:

```powershell
npm run azure:env
npm run reset
npm run dev
```

Open the Foundry portal as the primary presentation window. Open `http://localhost:3000?clawpilotTheme=dark`, or the optional `AZURE_WEB_APP_URI`, in a second window only for controlled workload generation and supporting visuals.

### Pre-demo checks

1. Confirm four model deployments and the YouTube baseline, nano, router, and knowledge agents.
2. Confirm `youtube-learning-toolbox` appears under Toolboxes.
3. Confirm `token-optimization-knowledge` appears under Knowledge and returns grounded records.
4. Confirm the three evaluation runs completed.
5. Confirm seeded requests appear in Tracing or Application Insights; ingestion can take several minutes.
6. Keep mock mode ready only as the no-network fallback.

See [`docs/AZURE-DEPLOYMENT.md`](docs/AZURE-DEPLOYMENT.md) for tenant roles, model customization, validation, traces, troubleshooting, optional model router, and teardown.

## Companion app screen references

These screenshots document the supporting application, not the primary presentation path. Portal screenshots are intentionally not committed because they commonly contain tenant, subscription, resource, trace, or prompt details.

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

## What the default deployment automates

- Resource group
- `Microsoft.CognitiveServices/accounts` with `kind: AIServices`
- Foundry project child resource with managed identity
- Configurable direct model deployments for `gpt-5-mini`, `gpt-5-nano`, and `gpt-4.1-mini`
- Preview `model-router` deployment
- Azure AI Search Basic with indexed token-optimization knowledge
- Log Analytics workspace and workspace-based Application Insights
- Foundry account/project Application Insights connections for agent tracing
- Foundry User role assignments for the project identity, presenter identity when available, and web-app identity
- YouTube baseline, nano, router, and knowledge prompt agents
- `youtube-learning-toolbox`
- Foundry IQ knowledge source, knowledge base, and project connection
- Baseline, nano, and router cloud evaluation runs
- Controlled requests that populate tracing and monitoring
- Optional Linux App Service and plan when `-DeployCompanionApp` is supplied
- Real runtime settings using managed identity and the Foundry project endpoint
- Idempotent prompt-agent creation/update

## Deliberately not claimed as automated

- **APIM semantic caching or Azure Managed Redis:** not provisioned. The cache page demonstrates the economics and behavior; it does not claim a managed semantic cache exists.
- **Claude deployment:** not provisioned by default because regional availability, marketplace terms, and routing policy vary. The logical `claude-opus-5` route maps to `gpt-5-mini` until you configure an approved deployment.
- **Private networking, CMK, APIM, and Redis:** optional production architecture work, not hidden defaults.

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
  ├─ Preview model router
  ├─ Azure AI Search + Foundry IQ knowledge
  ├─ Agents, toolbox, evaluations, and seeded traces
  ├─ Application Insights + Log Analytics + project connections
  ├─ Least-scope Foundry/monitoring RBAC
  └─ Optional App Service deployment, disabled by default
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
- `docs/FOUNDRY-PORTAL-WALKTHROUGH.md`: canonical portal navigation and handoffs to the companion app.
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
