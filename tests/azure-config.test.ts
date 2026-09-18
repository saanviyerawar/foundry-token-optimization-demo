import { describe, expect, it } from "vitest";
import { requiredAzureFiles } from "../lib/azure-config";

describe("Foundry deployment configuration", () => {
  it("includes the infrastructure and portal seeding assets", () => {
    expect(requiredAzureFiles).toContain("infra/main.bicep");
    expect(requiredAzureFiles).toContain("scripts/setup-portal-demo.ts");
    expect(requiredAzureFiles).toContain("data/youtube-transcript-evaluation.jsonl");
  });
});
