# Screenshot Capture Guide

Run `npm run reset`, then use a 1440×1000 browser viewport and append `?clawpilotTheme=dark` to every URL. Keep the left navigation visible. The six external screenshots below are composition references only; they are not copied into this repository.

## Reference-target captures

| Reference file | App page | Required state/action | Screenshot-ready composition |
|---|---|---|---|
| `C:\Users\syerawar\Pictures\Screenshots\Screenshot 2026-09-16 143245.png` | `/route-requests` | Submit the default prompt with **Balanced**, then keep the evaluation comparison and all four monitor panels in frame | Large route heading; baseline versus optimized evaluation cards; visible pass gate; four wide compact charts for model requests, non-200 outcomes, latency, and tokens/sec; recent decisions table beginning below |
| `C:\Users\syerawar\Pictures\Screenshots\Screenshot 2026-09-16 143309.png` | `/toolboxes` | Select **CRM operations** | Centered individual-definitions versus CRM-toolbox cards; compression arrow; input-token reduction; selection accuracy and cost metrics; compact tool chips on the left and three selected operations on the right |
| `C:\Users\syerawar\Pictures\Screenshots\Screenshot 2026-09-16 143324.png` | `/knowledge` | Fresh seeded state, with the Knowledge setup workspace at the top | Multi-step setup rail; name, description, model, reasoning effort, and retrieval-instruction fields; indexed source area showing four local documents; retrieval preview beginning below |
| `C:\Users\syerawar\Pictures\Screenshots\Screenshot 2026-09-16 143342.png` | `/traces` | Select the seeded first trace and click `chat_model_call`; place scrubber near 55% | Dense nested span waterfall with aligned duration bars; compact trace toolbar; selected row; right-side input/output detail panel; bottom time scrubber and current millisecond marker |
| `C:\Users\syerawar\Pictures\Screenshots\Screenshot 2026-09-16 143401.png` | `/telemetry` | Generate **25 requests** | Five top metric cards; large estimated-cost timeline; three compact charts for tokens, request volume, and time to first byte; load controls above |
| `C:\Users\syerawar\Pictures\Screenshots\Screenshot 2026-09-16 143218.png` | `/evaluations` | Fresh reset state for configuration capture; then a second capture after **Review and run** | Multi-step creation sidebar; mapped `input`, `expected`, and `answer` dataset fields; evaluator instructions; chips grouped by agent behavior, response quality, and safety; threshold and run action; aggregate result ribbon in the post-run capture |

## Full storyline capture sequence

| # | Page | Required state/action | Expected visual |
|---|---|---|---|
| 1 | `/` | Fresh seeded state; no action | Hero, ROI/evaluation/observability cards, and principle cards |
| 2 | `/evaluations` | Fresh reset configuration | Reference-target evaluation builder |
| 3 | `/evaluations` | Run threshold 3.7 | Aggregate ribbon and pass/fail dataset table |
| 4 | `/route-requests` | Submit default prompt with Balanced priority | Reference-target routing composition and optimized route rationale |
| 5 | `/route-requests` | Submit `Classify this support request as billing, outage, or access.` with Lowest latency | `gpt-5-nano`, low complexity, latency-oriented comparison |
| 6 | `/toolboxes` | Select CRM operations | Reference-target compression comparison |
| 7 | `/toolboxes` | Scroll to Principle 5 | Side-by-side bloated and concise prompts with separation chips |
| 8 | `/knowledge` | Capture the top workspace before retrieval | Reference-target knowledge setup composition |
| 9 | `/knowledge` | Run the default retrieval query | Ranked injected chunks and source-attributed simulated answer |
| 10 | `/traces` | Select `chat_model_call` and move the scrubber | Reference-target waterfall and selected-span detail |
| 11 | `/telemetry` | Generate 25 requests | Reference-target metrics and chart composition |
| 12 | `/telemetry` | Scroll to cache comparison | No cache, prompt-prefix cache, and response/semantic cache cards |
| 13 | `/` | Scroll to Wrap-up | Operating-loop text and evaluation CTA |

## Capture consistency

- Reset immediately before the sequence.
- Capture screenshots in order; routed requests and generated load persist and intentionally affect later telemetry.
- Avoid resizing between captures because chart labels and waterfall bars reflow.
- Use browser zoom at 90% if the 1440×1000 viewport does not include the bottom edge described in a target.
- If a browser prefers light mode, the query parameter still forces the documented dark theme.
- For a light-theme appendix, replace the parameter with `?clawpilotTheme=light` and capture the home, knowledge, and telemetry pages.
