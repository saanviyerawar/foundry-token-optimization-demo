import { createServer } from "node:http";
import {
    CanvasError,
    createCanvas,
    joinSession,
} from "@github/copilot-sdk/extension";
import { executeFoundryAgent } from "./foundry.mjs";
import { renderCanvasHtml } from "./renderer.mjs";
import {
    createPreview,
    loadState,
    resetState,
    saveState,
    updateState,
} from "./state.mjs";

const CANVAS_ID = "foundry-canvas";
const DEFAULT_DEMO_ID = "youtube-learning-pack";
const servers = new Map();
const subscribers = new Map();
let session;

function requireWorkspacePath() {
    if (!session?.workspacePath) {
        throw new CanvasError(
            "workspace_unavailable",
            "Foundry Canvas requires a Copilot session workspace to persist demo state.",
        );
    }
    return session.workspacePath;
}

function emitState(demoId, state) {
    const payload = `event: state\ndata: ${JSON.stringify(state)}\n\n`;
    for (const response of subscribers.get(demoId) ?? []) {
        response.write(payload);
    }
}

async function previewContext(input) {
    const workspacePath = requireWorkspacePath();
    const current = await loadState(workspacePath, input.demoId, input);
    const next = createPreview(current, input);
    await saveState(workspacePath, next);
    emitState(next.demoId, next);
    return next;
}

async function runAgent(demoId) {
    const workspacePath = requireWorkspacePath();
    let state = await loadState(workspacePath, demoId);
    if (!state.preview) {
        throw new CanvasError(
            "preview_required",
            "Preview the selected context before invoking the Foundry agent.",
        );
    }

    const setProgress = async (status, progress, message) => {
        state = await updateState(workspacePath, demoId, (current) => ({
            ...current,
            processing: {
                status,
                progress,
                message,
                updatedAt: new Date().toISOString(),
            },
            error: null,
        }));
        emitState(demoId, state);
    };

    try {
        await setProgress("authenticating", 15, "Authenticating with DefaultAzureCredential");
        const result = await executeFoundryAgent(state, setProgress);
        state = await updateState(workspacePath, demoId, (current) => ({
            ...current,
            processing: {
                status: "complete",
                progress: 100,
                message: "Learning pack generated",
                updatedAt: new Date().toISOString(),
            },
            output: result,
            error: null,
        }));
        emitState(demoId, state);
        return state;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        state = await updateState(workspacePath, demoId, (current) => ({
            ...current,
            processing: {
                status: "error",
                progress: 100,
                message: "Agent invocation failed",
                updatedAt: new Date().toISOString(),
            },
            error: message,
        }));
        emitState(demoId, state);
        throw new CanvasError("foundry_invocation_failed", message);
    }
}

async function refreshState(demoId) {
    const state = await loadState(requireWorkspacePath(), demoId);
    emitState(demoId, state);
    return state;
}

async function resetDemo(demoId) {
    const state = await resetState(requireWorkspacePath(), demoId);
    emitState(demoId, state);
    return state;
}

async function readJsonBody(request) {
    const contentType = request.headers["content-type"] ?? "";
    if (!contentType.startsWith("application/json")) {
        throw new CanvasError("invalid_content_type", "Requests must use application/json.");
    }

    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        size += chunk.length;
        if (size > 1_000_000) {
            throw new CanvasError("request_too_large", "Request body exceeds 1 MB.");
        }
        chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(body));
}

async function routeRequest(demoId, request, response) {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (request.method === "GET" && url.pathname === "/") {
        response.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
            "Content-Security-Policy": [
                "default-src 'self'",
                "script-src 'unsafe-inline'",
                "style-src 'unsafe-inline'",
                "connect-src 'self'",
                "img-src 'self' data:",
                "frame-ancestors 'self' github-copilot:",
            ].join("; "),
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
        });
        response.end(renderCanvasHtml(demoId));
        return;
    }

    if (request.method === "GET" && url.pathname === "/api/state") {
        sendJson(response, 200, await refreshState(demoId));
        return;
    }

    if (request.method === "GET" && url.pathname === "/events") {
        response.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        });
        const clients = subscribers.get(demoId) ?? new Set();
        clients.add(response);
        subscribers.set(demoId, clients);
        response.write(": connected\n\n");
        request.on("close", () => {
            clients.delete(response);
            if (clients.size === 0) subscribers.delete(demoId);
        });
        return;
    }

    if (request.method === "POST" && url.pathname === "/api/preview") {
        const body = await readJsonBody(request);
        sendJson(response, 200, await previewContext({ ...body, demoId }));
        return;
    }

    if (request.method === "POST" && url.pathname === "/api/run") {
        sendJson(response, 200, await runAgent(demoId));
        return;
    }

    if (request.method === "POST" && url.pathname === "/api/refresh") {
        sendJson(response, 200, await refreshState(demoId));
        return;
    }

    if (request.method === "POST" && url.pathname === "/api/reset") {
        sendJson(response, 200, await resetDemo(demoId));
        return;
    }

    sendJson(response, 404, { error: "Not found" });
}

async function startServer(instanceId, demoId) {
    const server = createServer((request, response) => {
        routeRequest(demoId, request, response).catch(async (error) => {
            const message = error instanceof Error ? error.message : String(error);
            sendJson(response, error instanceof SyntaxError ? 400 : 500, { error: message });
            await session?.log(`Foundry Canvas request failed: ${message}`, { level: "error" });
        });
    });
    server.on("clientError", (_error, socket) => socket.end("HTTP/1.1 400 Bad Request\r\n\r\n"));
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return { server, url: `http://127.0.0.1:${port}/`, demoId, instanceId };
}

const canvas = createCanvas({
    id: CANVAS_ID,
    displayName: "Foundry Canvas",
    description: "Preview explicit context and generate a cited learning pack with the existing Microsoft Foundry agent.",
    inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
            demoId: {
                type: "string",
                pattern: "^[a-z0-9][a-z0-9-]{2,63}$",
                description: "Stable logical demo ID used for persisted state.",
            },
            userRequest: { type: "string", maxLength: 4_000 },
            contextItems: {
                type: "array",
                maxItems: 20,
                items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        id: { type: "string", pattern: "^[a-zA-Z0-9._-]{1,64}$" },
                        label: { type: "string", maxLength: 120 },
                        content: { type: "string", maxLength: 100_000 },
                        provenance: { type: "string", maxLength: 200 },
                        included: { type: "boolean" },
                    },
                    required: ["id", "label", "content", "provenance", "included"],
                },
            },
            constraints: { type: "array", maxItems: 20, items: { type: "string", maxLength: 500 } },
            exclusions: { type: "array", maxItems: 20, items: { type: "string", maxLength: 500 } },
            assumptions: { type: "array", maxItems: 20, items: { type: "string", maxLength: 500 } },
        },
        required: ["demoId"],
    },
    actions: [
        {
            name: "preview_context",
            description: "Persist and return the exact context that would be sent to the Foundry agent.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    demoId: { type: "string", pattern: "^[a-z0-9][a-z0-9-]{2,63}$" },
                    userRequest: { type: "string", minLength: 1, maxLength: 4_000 },
                    contextItems: { type: "array", maxItems: 20 },
                    constraints: { type: "array", maxItems: 20, items: { type: "string", maxLength: 500 } },
                    exclusions: { type: "array", maxItems: 20, items: { type: "string", maxLength: 500 } },
                    assumptions: { type: "array", maxItems: 20, items: { type: "string", maxLength: 500 } },
                },
                required: ["demoId", "userRequest", "contextItems", "constraints", "exclusions", "assumptions"],
            },
            handler: async (ctx) => previewContext(ctx.input),
        },
        {
            name: "run_agent",
            description: "Run the existing live Foundry agent using only the most recently previewed context.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    demoId: { type: "string", pattern: "^[a-z0-9][a-z0-9-]{2,63}$" },
                },
                required: ["demoId"],
            },
            handler: async (ctx) => runAgent(ctx.input.demoId),
        },
        {
            name: "refresh_state",
            description: "Reload persisted demo status and output.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    demoId: { type: "string", pattern: "^[a-z0-9][a-z0-9-]{2,63}$" },
                },
                required: ["demoId"],
            },
            handler: async (ctx) => refreshState(ctx.input.demoId),
        },
        {
            name: "reset_demo",
            description: "Reset the logical demo to its safe default state.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
                properties: {
                    demoId: { type: "string", pattern: "^[a-z0-9][a-z0-9-]{2,63}$" },
                },
                required: ["demoId"],
            },
            handler: async (ctx) => resetDemo(ctx.input.demoId),
        },
    ],
    open: async (ctx) => {
        const demoId = ctx.input?.demoId ?? DEFAULT_DEMO_ID;
        await loadState(requireWorkspacePath(), demoId, ctx.input);
        let entry = servers.get(ctx.instanceId);
        if (entry && entry.demoId !== demoId) {
            servers.delete(ctx.instanceId);
            await new Promise((resolve) => entry.server.close(resolve));
            entry = undefined;
        }
        if (!entry) {
            entry = await startServer(ctx.instanceId, demoId);
            servers.set(ctx.instanceId, entry);
        }
        return {
            title: "Foundry Canvas",
            status: "Ready for explicit context preview",
            url: entry.url,
        };
    },
    onClose: async (ctx) => {
        const entry = servers.get(ctx.instanceId);
        if (entry) {
            servers.delete(ctx.instanceId);
            await new Promise((resolve) => entry.server.close(resolve));
        }
    },
});

session = await joinSession({ canvases: [canvas] });
