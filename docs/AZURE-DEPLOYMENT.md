# Azure Tenant Deployment Guide

## Deployment outcome

The default `azd up` creates a tenant-owned Foundry environment and deploys the Next.js demo to App Service. The application uses Microsoft Entra ID and its system-assigned managed identity to call the Foundry project Responses API.

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
| App Service B1 | On | Set `DEPLOY_WEB_APP=false` to omit |
| Prompt agent | On | Created or updated by post-provision hook |

## Prerequisites and roles

1. Install Node.js 22+, Azure CLI, Azure Developer CLI, and Git.
2. Select the correct Azure tenant and subscription.
3. Use an identity that can create the resource group and resources.
4. To automate RBAC, use Owner or User Access Administrator plus resource-creation permissions at the subscription/resource-group scope.
5. Confirm Foundry model availability and quota in the intended region.

Verify context:

```powershell
azd auth login
az account show --query "{subscription:name, tenant:tenantId}" --output table
az account get-access-token --resource https://ai.azure.com --query expiresOn --output tsv
```

`az login` is required only for helper scripts that call Azure CLI directly, including the model-router REST fallback and presenter-role repair.

## Default deployment

```powershell
npm install
npm run azure:deploy -- -EnvironmentName demo -Location eastus2
```

Or use azd directly:

```powershell
azd auth login
azd env new demo --location eastus2
azd up
```

The pre-provision hook sets safe defaults:

- `DEPLOY_WEB_APP=true`
- `ALLOW_API_KEY_AUTH=false`
- `CONNECT_APPLICATION_INSIGHTS=true`
- `DEPLOY_MODEL_ROUTER=false`
- `APP_SERVICE_SKU=B1`
- `MODEL_ROUTER_CAPACITY=10`

Use `azd env set <name> <value>` before `azd up` to change these.

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

Default deployed app behavior:

```text
AI_PROVIDER=foundry
FOUNDRY_USE_AGENT=false
```

This calls the selected direct deployment and preserves the routing demonstration. To route all requests through the created prompt agent, set `FOUNDRY_USE_AGENT=true` in App Service configuration or `.env.local`.

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
2. Open **Agents → Traces**. Server-side tracing is enabled by the Application Insights project connection.
3. Search by the trace ID shown in the routing result or load-generator output.
4. Open the Application Insights resource for transaction search, failures, performance, and Logs.
5. Use Azure Cost Management for authoritative spend. The app’s cost cards are illustrative estimates, not billing records.

Trace ingestion can contain prompts, outputs, and tool arguments. Do not send secrets or sensitive production data through this demo.

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
| Agent creation returns 403 | Wait for RBAC propagation, run `npm run azure:role`, then `npm run azure:agent`. |
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
