import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_REQUEST = "Create a learning pack with Key Points, a Study Guide, Flashcards, and source citations.";
const DEFAULT_VIDEO_URL = "https://www.youtube.com/watch?v=FFMm454fxNA";

function statePath(workspacePath, demoId) {
    return path.join(workspacePath, "files", "foundry-canvas", `${demoId}.json`);
}

function normalizeList(value, fallback = []) {
    return Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean)
        : fallback;
}

function normalizeContextItems(value, fallback) {
    if (!Array.isArray(value)) return fallback;
    return value.map((item, index) => ({
        id: String(item.id ?? `context-${index + 1}`).slice(0, 64),
        label: String(item.label ?? `Context ${index + 1}`).slice(0, 120),
        content: String(item.content ?? "").slice(0, 100_000),
        provenance: String(item.provenance ?? "User supplied").slice(0, 200),
        included: item.included !== false,
    }));
}

export function defaultState(demoId, initial = {}) {
    const defaultContext = [{
        id: "youtube-url",
        label: "YouTube video",
        content: DEFAULT_VIDEO_URL,
        provenance: "README demo input",
        included: true,
    }];
    return {
        version: 1,
        demoId,
        userRequest: String(initial.userRequest ?? DEFAULT_REQUEST).slice(0, 4_000),
        contextItems: normalizeContextItems(initial.contextItems, defaultContext),
        constraints: normalizeList(initial.constraints, [
            "Use only selected context items.",
            "Return concise, study-ready content grounded in the source.",
        ]),
        exclusions: normalizeList(initial.exclusions, [
            "Do not transfer chat history.",
            "Do not invent missing video content.",
        ]),
        assumptions: normalizeList(initial.assumptions, [
            "The selected URL is publicly reachable by the deployed agent tools.",
        ]),
        preview: null,
        processing: {
            status: "idle",
            progress: 0,
            message: "Preview context before sending",
            updatedAt: new Date().toISOString(),
        },
        output: null,
        error: null,
    };
}

export async function loadState(workspacePath, demoId, initial = {}) {
    const file = statePath(workspacePath, demoId);
    try {
        return JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
        if (error?.code !== "ENOENT") throw error;
        const state = defaultState(demoId, initial);
        await saveState(workspacePath, state);
        return state;
    }
}

export async function saveState(workspacePath, state) {
    const file = statePath(workspacePath, state.demoId);
    await mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    await rename(temporary, file);
    return state;
}

export async function updateState(workspacePath, demoId, updater) {
    const current = await loadState(workspacePath, demoId);
    return saveState(workspacePath, updater(current));
}

export function createPreview(current, input) {
    const contextItems = normalizeContextItems(input.contextItems, current.contextItems);
    const included = contextItems.filter((item) => item.included);
    const preview = {
        createdAt: new Date().toISOString(),
        userRequest: String(input.userRequest ?? current.userRequest).trim().slice(0, 4_000),
        contextItems: included,
        constraints: normalizeList(input.constraints, current.constraints),
        exclusions: normalizeList(input.exclusions, current.exclusions),
        assumptions: normalizeList(input.assumptions, current.assumptions),
        provenance: included.map((item) => ({
            id: item.id,
            label: item.label,
            source: item.provenance,
        })),
        transferPolicy: "Only the selected items shown here are sent. Conversation history is not included.",
    };
    preview.estimatedCharacters = JSON.stringify(preview).length;

    return {
        ...current,
        userRequest: preview.userRequest,
        contextItems,
        constraints: preview.constraints,
        exclusions: preview.exclusions,
        assumptions: preview.assumptions,
        preview,
        processing: {
            status: "previewed",
            progress: 0,
            message: `${included.length} context item(s) ready`,
            updatedAt: new Date().toISOString(),
        },
        output: null,
        error: included.length === 0 ? "Select at least one context item before running the agent." : null,
    };
}

export async function resetState(workspacePath, demoId) {
    await rm(statePath(workspacePath, demoId), { force: true });
    const state = defaultState(demoId);
    await saveState(workspacePath, state);
    return state;
}
