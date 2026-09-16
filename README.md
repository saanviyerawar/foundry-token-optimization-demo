# Foundry Agent Optimization Demo

A deployable Microsoft Foundry demonstration for model routing, MCP/toolbox compression, grounded retrieval, caching, tracing, telemetry, and evaluation-driven development.

The repository supports two modes:

- **Mock mode:** local, deterministic, no Azure resources or credentials.
- **Foundry mode:** tenant-owned Foundry resource and project, real model deployments, a real prompt agent, Application Insights, Log Analytics, managed identity, and an optional Azure App Service deployment.

## Local start

```powershell
npm install
npm run reset
npm run dev
```

Open `http://localhost:3000?clawpilotTheme=dark`.

## Deploy to your Azure tenant

> **Cost warning:** the deployment creates billable model capacity, Application Insights/Log Analytics, and by default a B1 App Service plan. Confirm regional model availability, quota, policy, and pricing before deployment.

Prerequisites:

- Node.js 22+
- Azure CLI
- Azure Developer CLI (`azd`) 1.29+
- An Azure subscription where you can create resource groups and role assignments. Owner is simplest for a demo; Contributor alone cannot create RBAC assignments.
- Permission to deploy the selected Foundry models in the chosen region.

One-command-ish path:

```powershell
npm install
npm run azure:deploy -- -EnvironmentName demo -Location eastus2
```

The wrapper authenticates with `azd`, creates/selects the environment, runs `azd up`, creates or updates the demo prompt agent, and writes non-secret local settings to `.env.local`.

Direct `azd` path:

```powershell
azd auth login
azd env new demo --location eastus2
azd up
```

After deployment:

```powershell
# Run locally against your tenant
npm run azure:env
npm run dev

# Preview safe real-load settings without making billable calls
npm run azure:load -- --count 5

# Explicitly generate real traffic, capped at 50 requests and concurrency 3
npm run azure:load -- --count 10 --rate 1 --concurrency 2 --execute
```

See [`docs/AZURE-DEPLOYMENT.md`](docs/AZURE-DEPLOYMENT.md) for tenant roles, model customization, validation, traces, troubleshooting, optional model router, and teardown.

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

The repository is initialized with Git but contains no commit.
