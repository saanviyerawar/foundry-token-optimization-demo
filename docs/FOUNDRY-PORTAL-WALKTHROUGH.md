# Microsoft Foundry Portal Walkthrough

This repository has one presentation surface: Microsoft Foundry.

## Before the session

1. Open `https://ai.azure.com`.
2. Select the project printed by `npm run azure:deploy`.
3. Confirm four model deployments.
4. Confirm `foundry-optimization-agent` and the four `youtube-*` agents.
5. Confirm five completed evaluation runs.
6. Confirm `youtube-learning-toolbox`.
7. Confirm `token-optimization-knowledge`.
8. Confirm seeded traces are visible; ingestion can take several minutes.

## Portal sequence

1. **Project overview:** endpoint, managed identity, and Application Insights connection.
2. **Models:** compare direct deployments with Model Router.
3. **Agents:** run a transcript excerpt through `youtube-router-agent`.
4. **Evaluations:** inspect model quality/safety, agent/tool, and customer-satisfaction results.
5. **Toolboxes:** show focused progressive disclosure.
6. **Knowledge:** retrieve relevant optimization guidance through Foundry IQ.
7. **Tracing:** attribute latency and token use to individual stages.
8. **Monitoring:** review operational request, latency, failure, and token signals.
9. **Spend:** use Azure Cost Management for authoritative billed cost.

The canonical agent output contains exactly:

```markdown
## Key Points

## Study Guide

## Flashcards
Q: ...
A: ...
```

Do not claim APIM/Redis response caching, private networking, or a live YouTube transcript-fetching service is deployed. The seeded workload supplies transcript text directly to Foundry.
