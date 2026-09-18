# Azure Tenant Deployment Guide

## Deployment outcome

The default deployment creates a tenant-owned Foundry environment and a runnable prompt agent for the Microsoft Foundry agent playground. The Next.js companion application is optional.

### Automated resources

| Resource | Default | Notes |
|---|---:|---|
| Resource group | On | `rg-foundry-opt-<environment>` |
| Foundry AIServices account | On | Project management enabled, local AI keys disabled by default |
| Foundry project | On | System-assigned identity |
| `gpt-5-mini` | On | Configurable deployment array |
| `gpt-5-nano` | On | Configurable deployment array |
| `gpt-4.1-mini` | On | Configurable deployment array |
| Model router | Off | Preview management API; explicit opt-in |
| Log Analytics | On | 30-day retention |
| Application Insights | On | Connected to Foundry account and project |
| App Service B1 | Off | Supply `-DeployCompanionApp` or set `DEPLOY_WEB_APP=true` |
| Prompt agent | On | Created or updated by post-provision hook |

## Prerequisites and roles

1. Install Node.js 22 LTS, Azure CLI, Azure Developer CLI, and Git. The repository includes `.nvmrc`.
2. Select the correct Azure tenant and subscription.
3. Use an identity that can create the resource group and resources.
4. To automate RBAC, use Owner or User Access Administrator plus resource-creation permissions at the subscription/resource-group scope.
5. Confirm Foundry model availability and quota in the intended region.

Verify context:

```powershell
az login
az account show --query "{subscription:name, tenant:tenantId}" --output table
az account get-access-token --resource https://ai.azure.com --query expiresOn --output tsv
```

The deployment wrapper uses this Azure CLI context as the source of truth, authenticates `azd` to the same tenant, and checks effective deployment and role-assignment permissions before provisioning.

## Default deployment

```powershell
npm install
npm run azure:deploy -- -EnvironmentName demo -Location eastus2
```

This provisions the directly runnable Foundry portal demo without App Service. To target a subscription other than the active Azure CLI subscription, add `-SubscriptionId <id>`.

Or provision the portal-first experience directly:

```powershell
azd auth login --tenant-id (az account show --query tenantId --output tsv)
azd env new demo --location eastus2 --subscription (az account show --query id --output tsv)
azd provision
```

After provisioning, open `https://ai.azure.com`, select the `FOUNDRY_PROJECT_NAME` printed by the deployment, and run `foundry-optimization-agent` in the agent playground.

To deploy the optional companion application:

```powershell
npm run azure:deploy:companion -- -EnvironmentName demo -Location eastus2
```

Both commands create or update the same Foundry project, model deployments, prompt agent, and monitoring connection. The companion command additionally provisions and deploys App Service.

The pre-provision hook sets safe defaults:

- `DEPLOY_WEB_APP=false`
- `ALLOW_API_KEY_AUTH=false`
- `CONNECT_APPLICATION_INSIGHTS=true`
- `DEPLOY_MODEL_ROUTER=false`
- `APP_SERVICE_SKU=B1`
- `MODEL_ROUTER_CAPACITY=10`

Use `azd env set <name> <value>` before `azd provision`, or before `azd up` when deploying the companion app, to change these.

## Regional model and quota customization

The `modelDeployments` parameter in `infra/main.bicep` contains deployment names, model names, versions, SKU names, and capacities. Update it before provisioning when a region does not offer a default model/version or when your quota requires a different capacity.

List currently available models:

```powershell
az cognitiveservices model list --location eastus2 --query "[?model.lifecycleStatus=='GenerallyAvailable'].{name:model.name,version:model.version,format:model.format}" --output table
```

Model availability changes independently by region and subscription. A failed model deployment does not mean the Foundry account/project shape is invalid; select a supported version and rerun `azd provision`.

### Claude route

The app retains `claude-opus-5` as a logical demo route. The default Azure environment maps that route to `gpt-5-mini`. To use Claude:

1. Confirm the model is available in your region.
2. Accept any required marketplace terms.
3. Deploy the approved Claude model from the Foundry model catalog.
4. Set `MODEL_DEPLOYMENT_CLAUDE_OPUS_5` to the deployment name in App Service and `.env.local`.

The repository does not silently deploy or claim Claude capacity.

## Model router

Model router uses `Microsoft.CognitiveServices/accounts/deployments@2025-10-01-preview`, so it is disabled by default.

Enable during provisioning:

```powershell
npm run azure:deploy -- -EnvironmentName demo -Location eastus2 -DeployModelRouter
```

Or deploy it explicitly after `az login`:

```powershell
npm run azure:router -- -Version 2025-11-18 -Capacity 10
```

The fallback uses an idempotent management-plane `PUT`. Confirm preview acceptance, regional availability, Azure Policy publisher allowances, and quota first.

## Agent and provider modes

The post-provision hook creates or updates `foundry-optimization-agent` through `@azure/ai-projects` and `DefaultAzureCredential`.

Default local or optionally deployed companion behavior:

```text
AI_PROVIDER=foundry
FOUNDRY_USE_AGENT=true
```

This routes requests through the prompt agent created in Foundry. Set `FOUNDRY_USE_AGENT=false` only when intentionally demonstrating direct deployment routing from the companion app.

If the presenter role was not assigned because `AZURE_PRINCIPAL_ID` was unavailable:

```powershell
az login
npm run azure:role
npm run azure:agent
```

## Controlled real load

Dry run:

```powershell
npm run azure:load -- --count 5
```

Execute:

```powershell
npm run azure:load -- --count 10 --rate 1 --concurrency 2 --execute
```

Safeguards:

- `--execute` is mandatory for billable calls.
- Default count is 5; maximum is 50.
- Default rate is 1 request/second; maximum is 5.
- Default concurrency is 2; maximum is 3.
- When `AZURE_WEB_APP_URI` exists, load goes through the deployed app so local JSON telemetry and Azure traces update together.

## Inspect real traces and spend

1. Open the Foundry project at `https://ai.azure.com`.
2. Open `foundry-optimization-agent` and run a baseline prompt in the portal playground.
3. Open the agent or project trace view. Server-side tracing is enabled by the Application Insights project connection.
4. Search by the trace ID shown in the routing result or load-generator output.
5. Open the Foundry monitoring experience and the Application Insights resource for request, failure, performance, and log analysis.
6. Use Azure Cost Management for authoritative spend. The app’s cost cards are illustrative estimates, not billing records.

Trace ingestion can contain prompts, outputs, and tool arguments. Do not send secrets or sensitive production data through this demo.

The canonical presentation is portal-first. Follow [`FOUNDRY-PORTAL-WALKTHROUGH.md`](FOUNDRY-PORTAL-WALKTHROUGH.md); use the deployed application as a workload generator and supporting visualization surface.

## Manual and optional services

These are not provisioned:

- **Foundry IQ:** create and connect a knowledge source manually if available in your tenant. The local knowledge page remains an inspectable retrieval teaching aid.
- **APIM semantic cache / Azure Managed Redis:** add manually if you want a production semantic cache. The UI compares cache strategies but does not claim these services exist.
- **Private endpoints, VNet integration, customer-managed keys, and Azure Policy customization:** required in some enterprises but intentionally excluded from the demo default.

## Validation and what-if

Credential-free:

```powershell
npm run azure:validate
az bicep lint --file infra/main.bicep
az bicep build --file infra/main.bicep
```

Authenticated subscription what-if:

```powershell
az deployment sub what-if `
  --location eastus2 `
  --template-file infra/main.bicep `
  --parameters environmentName=whatif location=eastus2 deployWebApp=false deployModelRouter=false
```

What-if can still fail on tenant policy, provider registration, model catalog validation, or missing role-assignment permission. It creates no resources.

## Troubleshooting

| Symptom | Resolution |
|---|---|
| Model deployment fails | List models for the selected region, update model/version/SKU/capacity, and rerun `azd provision`. |
| Model deployments report `Another operation is being performed on the parent resource` | Pull the latest repository version. Direct model deployments are serialized to avoid concurrent updates to the same Foundry account; rerunning remains safe and idempotent. |
| Agent creation returns 403 | Wait for RBAC propagation, run `npm run azure:role`, then `npm run azure:agent`. |
| `azd` requests a subscription or targets the wrong tenant | Run `az login`, select the intended subscription with `az account set --subscription <id>`, then rerun the wrapper. It binds `azd` to that subscription and tenant. |
| Next.js fails to load `@next/swc-win32-x64-msvc` | Use Node.js 22 LTS, remove `node_modules` and `.next`, then run `npm ci`. On Windows, repair the Microsoft Visual C++ 2015-2022 Redistributable (x64) if the native binary still cannot load. |
| App returns provider 502 | Check App Service environment variables, managed-identity role assignment, deployment state, and quota. |
| No Foundry traces appear | Confirm the App Insights connection under project details, generate fresh traffic, and wait several minutes. |
| App Service starts but data resets | Confirm `DATA_DIRECTORY=/home/data`; avoid scaling to multiple instances because JSON persistence is a single-instance demo design. |
| Model router fails | Confirm preview API support, region, quota, policy publisher allowlist, and model-router version. Keep it disabled if unavailable. |
| Claude route uses GPT | Expected default. Deploy Claude separately and update the logical mapping. |
| Role assignment deployment fails | The deploying identity lacks `Microsoft.Authorization/roleAssignments/write`; use Owner/User Access Administrator or have an administrator preassign roles. |

## Teardown

```powershell
npm run azure:down -- -Force
```

This runs `azd down --purge --force` for the selected environment. Confirm the active environment with `azd env list` before deletion.
