# Screenshot Capture Guide

The live demo is portal-first. Do not use these application screenshots as a substitute for opening the deployed Foundry project during the presentation.

Run `npm run reset`, then use a 1600x1000 browser viewport and append `?clawpilotTheme=dark` to every URL. Keep the left navigation visible. These captures document the companion application and provide an offline fallback.

Do not commit Foundry portal screenshots containing tenant, subscription, resource, trace, prompt, or identity details. Capture sanitized portal images separately only when the presentation requires them.

## Repository screenshots

| File | App page | Required state/action |
|---|---|---|
| `docs/images/storyline.png` | `/` | Fresh seeded state |
| `docs/images/evaluations.png` | `/evaluations` | Fresh reset configuration |
| `docs/images/route-requests.png` | `/route-requests` | Submit the default prompt with **Balanced** |
| `docs/images/toolboxes.png` | `/toolboxes` | Select **CRM operations** |
| `docs/images/knowledge.png` | `/knowledge` | Fresh seeded knowledge workspace |
| `docs/images/traces.png` | `/traces` | Select a nested span |
| `docs/images/telemetry.png` | `/telemetry` | Generate **25 requests** |

## Companion capture sequence

| # | Page | Required state/action | Expected visual |
|---|---|---|---|
| 1 | `/` | Fresh seeded state; no action | Portal-first handoff, ROI equation, evaluation-driven development, and five-principle overview |
| 2 | `/evaluations` | Fresh reset configuration | Evaluation builder, mapped dataset fields, grouped evaluator families, and threshold |
| 3 | `/evaluations` | Run threshold 3.7 | Aggregate ribbon and pass/fail dataset table |
| 4 | `/route-requests` | Submit default prompt with Balanced priority | Model-routing comparison, rationale, pass gate, and monitor signals |
| 5 | `/route-requests` | Submit `Classify this support request as billing, outage, or access.` with Lowest latency | `gpt-5-nano`, low complexity, latency-oriented comparison |
| 6 | `/toolboxes` | Select CRM operations | Individual schemas versus compressed toolbox |
| 7 | `/knowledge` | Capture the top workspace, then run retrieval | Foundry IQ storyline, local source configuration, ranked chunks, and citations |
| 8 | `/telemetry` | Scroll to cache comparison | No cache, prompt-prefix cache, and APIM/Redis response-cache storyline |
| 9 | `/toolboxes` | Scroll to Principle 5 | Side-by-side bloated and concise prompts with separation chips |
| 10 | `/telemetry` | Generate 25 requests | Request, token, cost, latency, and cache telemetry |
| 11 | `/traces` | Select `chat_model_call` and move the scrubber | Waterfall and selected-span input/output details |
| 12 | `/telemetry` | Return to headline metrics and accumulated cost | Foundry spend-metrics storyline |
| 13 | `/` | Scroll to Wrap-up | Operating loop and business ROI close |

## Capture consistency

- Reset immediately before the sequence.
- Capture screenshots in order; routed requests and generated load persist and intentionally affect later telemetry.
- Avoid resizing between captures because chart labels and waterfall bars reflow.
- Use browser zoom at 90% if the 1440×1000 viewport does not include the bottom edge described in a target.
- If a browser prefers light mode, the query parameter still forces the documented dark theme.
- For a light-theme appendix, replace the parameter with `?clawpilotTheme=light` and capture the home, knowledge, and telemetry pages.
