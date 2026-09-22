const DEFAULT_ACCOUNT = "foundry-opt-australia-7tiitcffaqbty";
const DEFAULT_PROJECT = "optimization-demo-australia";
const DEFAULT_AGENT = "foundry-optimization-agent";
const DEFAULT_ENDPOINT = `https://${DEFAULT_ACCOUNT}.services.ai.azure.com/api/projects/${DEFAULT_PROJECT}`;

function buildPrompt(preview) {
    const context = preview.contextItems
        .map((item, index) => [
            `Context ${index + 1}: ${item.label}`,
            `Provenance: ${item.provenance}`,
            item.content,
        ].join("\n"))
        .join("\n\n");

    return [
        "Complete the user request using only the explicitly selected context below.",
        "Do not infer or use conversation history.",
        "Return Markdown sections named exactly Key Points, Study Guide, and Flashcards.",
        "Include source citations for claims derived through web or browser tools.",
        "",
        `USER REQUEST\n${preview.userRequest}`,
        "",
        `SELECTED CONTEXT\n${context}`,
        "",
        `CONSTRAINTS\n${preview.constraints.map((item) => `- ${item}`).join("\n") || "- None"}`,
        "",
        `EXCLUSIONS\n${preview.exclusions.map((item) => `- ${item}`).join("\n") || "- None"}`,
        "",
        `EDITABLE ASSUMPTIONS\n${preview.assumptions.map((item) => `- ${item}`).join("\n") || "- None"}`,
    ].join("\n");
}

function section(markdown, name, nextNames) {
    const next = nextNames.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    const pattern = new RegExp(
        `(?:^|\\n)#{1,3}\\s*${name}\\s*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s*(?:${next})\\s*\\n|$)`,
        "i",
    );
    return markdown.match(pattern)?.[1]?.trim() ?? "";
}

function collectCitations(response, rawText) {
    const citations = [];
    for (const item of response.output ?? []) {
        for (const content of item.content ?? []) {
            for (const annotation of content.annotations ?? []) {
                if (annotation.type === "url_citation" && annotation.url) {
                    citations.push({
                        title: annotation.title || annotation.url,
                        url: annotation.url,
                        provenance: "Foundry agent URL citation",
                    });
                }
            }
        }
    }
    for (const match of rawText.matchAll(/https?:\/\/[^\s<>()\]]+/g)) {
        citations.push({
            title: match[0],
            url: match[0].replace(/[.,;:]+$/, ""),
            provenance: "Agent response link",
        });
    }
    for (const match of rawText.matchAll(/^Source:\s*(.+)$/gim)) {
        citations.push({
            title: match[1].trim(),
            url: null,
            provenance: "Agent response source attribution",
        });
    }
    const sourceSection = rawText.match(
        /(?:^|\n)#{1,3}\s*(?:Sources?|Citations)\s*\n([\s\S]*?)(?=\n#{1,3}\s|$)/i,
    )?.[1];
    for (const source of sourceSection?.split(/\r?\n/) ?? []) {
        const title = source.replace(/^[-*]\s*/, "").trim();
        if (title) {
            citations.push({
                title,
                url: null,
                provenance: "Agent response source attribution",
            });
        }
    }
    return [...new Map(citations.map((item) => [item.url ?? item.title, item])).values()];
}

function formatFailure(error, endpoint, agentName) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "Error";
    if (/credential|authentication|unauthorized|401|403|login/i.test(`${name} ${message}`)) {
        return [
            "Azure authentication failed.",
            "Run `az login` with an identity that has the Foundry User role, then retry.",
            `Agent: ${agentName}. Endpoint: ${endpoint}.`,
            `Details: ${message}`,
        ].join(" ");
    }
    if (/ENOTFOUND|ECONN|endpoint|404/i.test(message)) {
        return [
            "Foundry configuration or connectivity failed.",
            "Verify FOUNDRY_PROJECT_ENDPOINT and FOUNDRY_AGENT_NAME.",
            `Agent: ${agentName}. Endpoint: ${endpoint}.`,
            `Details: ${message}`,
        ].join(" ");
    }
    return `Foundry agent ${agentName} failed: ${message}`;
}

export async function executeFoundryAgent(state, setProgress) {
    const endpoint = process.env.FOUNDRY_PROJECT_ENDPOINT ?? DEFAULT_ENDPOINT;
    const agentName = process.env.FOUNDRY_AGENT_NAME ?? DEFAULT_AGENT;
    if (!state.preview?.contextItems?.length) {
        throw new Error("No selected context is available. Preview at least one included item.");
    }

    try {
        const [{ AIProjectClient }, { DefaultAzureCredential }] = await Promise.all([
            import("@azure/ai-projects"),
            import("@azure/identity"),
        ]);
        const project = new AIProjectClient(endpoint, new DefaultAzureCredential());
        await project.agents.get(agentName);
        await setProgress("running", 45, `Invoking ${agentName}`);
        const openai = project.getOpenAIClient({
            azureConfig: { allowPreview: true, agentName },
        });
        const response = await openai.responses.create({
            input: buildPrompt(state.preview),
            max_output_tokens: 1_800,
            metadata: {
                demo_id: state.demoId,
                experience: "foundry-canvas",
            },
        });
        await setProgress("formatting", 85, "Organizing generated learning content");
        const raw = response.output_text?.trim() ?? "";
        if (!raw) throw new Error("The agent returned no text output.");
        return {
            generatedAt: new Date().toISOString(),
            responseId: response.id,
            agent: {
                account: DEFAULT_ACCOUNT,
                project: DEFAULT_PROJECT,
                name: agentName,
                endpoint,
            },
            keyPoints: section(raw, "Key Points", ["Study Guide", "Flashcards"]) || raw,
            studyGuide: section(raw, "Study Guide", ["Flashcards"]),
            flashcards: section(raw, "Flashcards", ["Citations", "Source", "Sources"]),
            citations: collectCitations(response, raw),
            raw,
        };
    } catch (error) {
        throw new Error(formatFailure(error, endpoint, agentName), { cause: error });
    }
}
