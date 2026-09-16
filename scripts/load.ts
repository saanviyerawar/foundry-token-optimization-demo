import { createRequest } from "../lib/routing";
import { makeTrace } from "../lib/seed-data";
import { updateData } from "../lib/storage";

async function main() {
  const count = Math.min(500, Math.max(1, Number(process.argv[2] ?? 25)));
  const prompts = [
    "Classify this service request.",
    "Retrieve the token policy and explain the budget.",
    "Analyze architecture trade-offs and recommend a design.",
    "Use CRM tools to update the opportunity.",
  ];
  await updateData((data) => {
    const generated = Array.from({ length: count }, (_, index) =>
      createRequest(prompts[index % prompts.length], ["cost", "latency", "balanced", "quality"][index % 4] as "cost" | "latency" | "balanced" | "quality", Date.now() + index),
    );
    data.requests.push(...generated);
    data.traces.push(...generated.slice(0, Math.min(10, generated.length)).map((generatedRequest) => makeTrace(generatedRequest)));
  });
  console.log(`Generated ${count} simulated requests.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
