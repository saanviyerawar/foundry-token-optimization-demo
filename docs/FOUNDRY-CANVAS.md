# Foundry Canvas

Foundry Canvas is a project-scoped GitHub Copilot App canvas extension. It uses
the existing `optimization-demo-australia` project and
`foundry-optimization-agent`; it does not deploy Azure resources or run a
companion web application.

## Prerequisites and authentication

1. Use Node.js 22 and install the repository dependencies with `npm ci`.
2. Install Azure CLI and run `az login`.
3. Ensure that the signed-in identity has the **Foundry User** role on the
   existing project.
4. Start GitHub Copilot App from this repository so it discovers
   `.github/extensions/foundry-canvas/extension.mjs`.

The extension uses `DefaultAzureCredential`. Azure credentials remain in the
extension process and are never sent to the iframe.

The existing deployment is the default:

| Setting | Default | Environment variable |
|---|---|---|
| Project endpoint | `https://foundry-opt-australia-7tiitcffaqbty.services.ai.azure.com/api/projects/optimization-demo-australia` | `FOUNDRY_PROJECT_ENDPOINT` |
| Agent | `foundry-optimization-agent` | `FOUNDRY_AGENT_NAME` |

Set either environment variable before launching GitHub Copilot App only when
targeting a compatible existing deployment. The extension never creates or
updates the project, agent, models, tools, or role assignments.

## Launch

Ask Copilot:

```text
Open Foundry Canvas with demoId youtube-learning-pack.
```

The canvas ID is `foundry-canvas`, its display name is **Foundry Canvas**, and
the stable `demoId` must match `^[a-z0-9][a-z0-9-]{2,63}$`. State is stored as a
session artifact under:

```text
files/foundry-canvas/<demoId>.json
```

State is keyed by the logical demo ID, not the transient canvas `instanceId`.

## Demo flow

1. **Input Context:** edit the request, paste a YouTube URL or transcript into
   a context field, include or exclude items, review provenance, constraints,
   exclusions, and editable assumptions, then select **Preview context**.
2. **Agent / Skill Processing:** verify the exact preview and select
   **Run live agent**. Only the previewed items are sent; conversation history
   is never transferred implicitly.
3. **Generated Integration Output:** review Key Points, Study Guide,
   Flashcards, citations, response provenance, and processing status.

**Refresh** reloads the persisted logical demo state. **Reset demo** restores
the safe defaults. Authentication, endpoint, and agent failures are shown
directly in the canvas with remediation guidance.
