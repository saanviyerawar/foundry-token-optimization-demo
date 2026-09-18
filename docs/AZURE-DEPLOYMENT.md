# Foundry Deployment Guide

## Outcome

The deployment creates a Foundry-only YouTube learning-agent demonstration with models, Model Router, agents, evaluations, a toolbox, Foundry IQ knowledge, traces, and monitoring. No application hosting resource is defined.

## Resources

| Resource | Default |
|---|---:|
| Foundry AIServices account and project | On |
| `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1-mini` | On |
| `model-router` | On |
| Azure AI Search Basic | On |
| Foundry IQ index, source, knowledge base, and connection | On |
| Log Analytics and Application Insights | On |
| Canonical and comparison agents | On |
| Toolbox, evaluation runs, and trace traffic | On |

## Prerequisites

1. Node.js 22 LTS.
2. Azure CLI and Azure Developer CLI 1.29+.
3. Owner, or Contributor plus Role Based Access Control Administrator/User Access Administrator.
4. Model availability and quota in the selected region.

```powershell
az login
az account show --query "{subscription:name, tenant:tenantId}" --output table
```

## Deploy

```powershell
npm install
npm run azure:deploy -- -EnvironmentName australia -Location australiaeast
```

The wrapper:

1. Uses the active Azure CLI subscription unless `-SubscriptionId` is supplied.
2. Authenticates `azd` to the same tenant.
3. Checks deployment-validation and role-assignment permissions.
4. Provisions Foundry, models, Search, monitoring, and RBAC.
5. Creates or updates the YouTube learning agents.
6. Creates the toolbox and Foundry IQ assets.
7. Runs five cloud evaluations.
8. Generates real trace traffic.

Optional parameters:

```powershell
npm run azure:deploy -- -SubscriptionId <subscription-id>
npm run azure:deploy -- -SearchLocation <alternate-search-region>
npm run azure:deploy -- -PrincipalId <presenter-object-id>
npm run azure:deploy -- -SkipPortalDemoAssets
```

Use a separate Search region when the primary region reports insufficient Basic SKU capacity. Use `-PrincipalId` when the tenant blocks Microsoft Graph lookup for the deploying identity.

## Model customization

Edit `modelDeployments` in `infra/main.bicep` when the selected region requires different versions, SKUs, or capacities.

```powershell
az cognitiveservices model list `
  --location australiaeast `
  --query "[?model.format=='OpenAI'].{name:model.name,version:model.version}" `
  --output table
```

Direct model deployments are serialized. Model Router depends on all direct deployments, avoiding concurrent writes to the Foundry account.

## Recreate portal assets

```powershell
azd env select australia
npm run azure:portal-assets
```

This operation is idempotent for agents and named evaluation runs. It can create a new toolbox version and makes billable evaluation/inference calls when work is missing.

## Inspect the result

Open `https://ai.azure.com` and select the project printed after deployment.

- **Agents:** `foundry-optimization-agent` and the `youtube-*` comparison agents.
- **Evaluations:** mini, nano, router, agent/tool, and customer-satisfaction runs.
- **Tools:** `youtube-learning-toolbox`.
- **Knowledge:** `token-optimization-knowledge`.
- **Tracing:** seeded requests from baseline, nano, and router agents.
- **Monitoring:** Foundry and Application Insights operational signals.

Azure Cost Management is authoritative for billed spend.

## Validation

```powershell
npm run azure:validate
npm run lint
npm test
az bicep build --file infra/main.bicep
```

Authenticated what-if:

```powershell
az deployment sub what-if `
  --location australiaeast `
  --template-file infra/main.bicep `
  --parameters environmentName=whatif location=australiaeast searchLocation=australiaeast
```

## Troubleshooting

| Symptom | Resolution |
|---|---|
| Model is unavailable | Select a supported model/version for the region and rerun. |
| Parent-resource operation conflict | Pull the latest repository and rerun; models and Router are serialized. |
| Search Basic has insufficient capacity | Pass `-SearchLocation` with another supported region. |
| Presenter object ID cannot be resolved | Pass `-PrincipalId <object-id>`. |
| Agent creation returns 403 | Wait for RBAC propagation, then run `npm run azure:role` and `npm run azure:agent`. |
| No traces appear | Confirm the Application Insights connection, generate fresh agent traffic, and allow several minutes for ingestion. |
| Evaluation feature is unavailable | Confirm Foundry evaluation region support and the selected judge model. |

## Teardown

```powershell
azd env select australia
npm run azure:down -- -Force
```

This deletes the selected environment's resource group.
