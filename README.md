# Microsoft Foundry Token Optimization Demo

A **Foundry-only** YouTube learning-agent demonstration covering:

- Token economics and business ROI
- Evaluation-driven development
- Model routing
- Context optimization and Toolboxes
- Foundry IQ retrieval
- Prompt and response-caching economics
- Simplification
- Tracing, telemetry, and spend

The agent turns a YouTube URL or supplied transcript into **Key Points**, a
**Study Guide**, and **Flashcards**. There is no companion web application.

> **Cost warning:** deployment creates billable model capacity, Model Router,
> Azure AI Search Basic, a Playwright Workspace, Application Insights, and Log
> Analytics. It also makes real inference and evaluation calls.

## What gets deployed

- Foundry account and project
- `gpt-5-mini`, `gpt-5-nano`, `gpt-4.1-mini`, and `model-router`
- `foundry-optimization-agent` and four comparison/knowledge agents
- Browser Automation through an Azure Playwright Workspace
- `youtube-learning-toolbox`
- Azure AI Search and `token-optimization-knowledge`
- Five seeded evaluation runs
- Application Insights, Log Analytics, and representative trace traffic

APIM/Redis response caching is explained in the demo but is not provisioned.
Azure Cost Management remains the authoritative source for billed spend.

## Open the live demo

[Open Microsoft Foundry](https://ai.azure.com) and select:

- Account: `foundry-opt-australia-7tiitcffaqbty`
- Project: `optimization-demo-australia`
- Agent: `foundry-optimization-agent`

The GitHub repository is public, but the Azure resources are not anonymous.
Viewers must sign in to the deployment's Microsoft Entra tenant and have the
**Foundry User** role on the project. See
[the deployment guide](docs/AZURE-DEPLOYMENT.md) for access details.

## Set up your own deployment

### Prerequisites

- Node.js 22 LTS
- Azure CLI
- Azure Developer CLI (`azd`) 1.29+
- Owner, or Contributor plus Role Based Access Control Administrator/User
  Access Administrator
- Regional model quota

### Deploy

```powershell
git clone https://github.com/saanviyerawar/foundry-token-optimization-demo.git
cd foundry-token-optimization-demo
npm install
az login
npm run azure:deploy -- -EnvironmentName australia -Location australiaeast
```

The deployment aligns Azure CLI and `azd`, validates permissions, provisions
the resources, creates the agents and knowledge assets, runs the evaluations,
and generates trace traffic.

Useful options:

```powershell
# Select a subscription explicitly
npm run azure:deploy -- -SubscriptionId <subscription-id>

# Put Search in another region when Basic capacity is unavailable
npm run azure:deploy -- -Location australiaeast -SearchLocation centralus

# Supply the presenter object ID when Microsoft Graph lookup is blocked
npm run azure:deploy -- -PrincipalId <object-id>

# Deploy core resources without evaluations and seeded portal assets
npm run azure:deploy -- -SkipPortalDemoAssets
```

After deployment, open [Microsoft Foundry](https://ai.azure.com) and select the
project printed by the command.

## Prepare before the demo

Complete this checklist 15-30 minutes before presenting:

1. Sign in to Foundry and open `optimization-demo-australia`.
2. Open `foundry-optimization-agent` and run:

   ```text
   Create the learning pack for this YouTube video:
   https://www.youtube.com/watch?v=FFMm454fxNA
   ```

3. Confirm the response contains Key Points, Study Guide, Flashcards, and a
   source citation. Keep the successful response open.
4. Confirm the four model deployments and five completed evaluation runs.
5. Open `youtube-learning-toolbox` and `token-optimization-knowledge`.
6. Confirm an existing trace is visible. New telemetry can take several
   minutes to appear.
7. Open the portal pages in separate tabs in this order: project, agent,
   models, evaluations, Toolbox, knowledge, tracing, and monitoring.
8. Keep this README open as the visual fallback. Do not create new evaluations
   or repeatedly rerun the agent during the presentation.

## Run the demo

| Topic | Navigate to | What to show and explain |
|---|---|---|
| Tokenomics and ROI | Project overview, then `token-optimization-knowledge` | Tokens are one input cost. **ROI = business-process value - complete solution cost**. |
| Business outcome | Agents → `foundry-optimization-agent` | Run the prepared YouTube prompt and show Key Points, Study Guide, Flashcards, and citation. |
| Evaluation-driven development | Evaluate → Evaluations | Baseline → change → evaluate → compare → release or reject. Compare mini, nano, and Router quality/safety runs. |
| 1. Model routing | Models → Deployments | Compare direct models with `model-router`; choose the smallest capable model only when evaluations still pass. |
| 2. Optimize context | Tools → Toolboxes → `youtube-learning-toolbox` | Concise instructions, focused tools, skills, and progressive disclosure reduce repeated context. |
| 3. Retrieval | Knowledge → `token-optimization-knowledge` | Foundry IQ retrieves relevant, attributable evidence instead of embedding everything in the prompt. |
| 4. Caching | Agent or knowledge screen | Explain prompt-prefix caching and APIM/Redis response caching. Do not claim APIM/Redis is deployed. |
| 5. Simplify | `foundry-optimization-agent` definition | Remove unnecessary instructions, chunks, tools, steps, retries, and verbose output. |
| Tracing | Agent → Traces or Observe → Tracing | Show model, retrieval, and tool spans with latency, tokens, errors, and retries. |
| Telemetry | Observe → Monitoring | Show request, latency, token, model-activity, and failure signals. |
| Spend | Monitoring plus Azure Cost Management | Foundry explains usage; Azure Cost Management provides authoritative billed spend. |
| Wrap-up | Return to the successful agent response | **Evaluate → optimize → trace → monitor → evaluate again.** |

The complete presenter wording is in
[the live-demo runbook](docs/DEMO-RUNBOOK.md), with navigation details in the
[portal walkthrough](docs/FOUNDRY-PORTAL-WALKTHROUGH.md).

## Screenshots

### Evaluation criteria and setup

![Foundry evaluation criteria](docs/images/foundry-evaluation-criteria.png)

![Foundry evaluation setup](docs/images/foundry-evaluation-setup.png)

### Evaluation results

![Foundry evaluation results](docs/images/foundry-evaluation-results.png)

### Toolboxes

![Foundry Toolboxes](docs/images/foundry-toolboxes.png)

### Foundry IQ knowledge

![Foundry IQ knowledge](docs/images/foundry-knowledge.png)
