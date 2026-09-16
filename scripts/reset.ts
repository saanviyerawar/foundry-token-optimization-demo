import { resetData } from "../lib/storage";

async function main() {
  await resetData();
  console.log("Foundry Agent Optimization Demo reset to deterministic seed data.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
