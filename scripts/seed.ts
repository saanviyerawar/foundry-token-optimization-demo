import { resetData } from "../lib/storage";

async function main() {
  const data = await resetData();
  console.log(`Seeded ${data.requests.length} requests, ${data.traces.length} traces, and ${data.knowledge.length} documents.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
