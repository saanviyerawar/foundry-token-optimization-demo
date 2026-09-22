function jsonForScript(value) {
    return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export function renderCanvasHtml(demoId) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Foundry Canvas</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--background-color-default, #fff);
      color: var(--text-color-default, #1f2328);
      font: var(--text-body-medium, 14px)/var(--leading-body-medium, 20px) var(--font-sans, "Segoe UI", sans-serif);
    }
    button, textarea { font: inherit; }
    button:focus-visible, textarea:focus-visible, input:focus-visible {
      outline: 2px solid var(--color-focus-outline, #0969da);
      outline-offset: 2px;
    }
    .shell { max-width: 1180px; margin: 0 auto; padding: 24px; }
    .hero { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; margin-bottom: 20px; }
    h1 { margin: 0 0 6px; font-size: var(--text-title-large, 26px); line-height: var(--leading-title-large, 32px); }
    h2 { margin: 0; font-size: var(--text-title-medium, 20px); }
    h3 { margin: 0 0 10px; font-size: var(--text-title-small, 16px); }
    p { margin: 0; }
    .muted { color: var(--text-color-muted, #656d76); }
    .domain { font-family: var(--font-mono, Consolas, monospace); font-size: var(--text-code-inline, 12px); }
    .pipeline { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
    .pipeline div { padding: 12px; border: 1px solid var(--border-color-default, #d0d7de); border-radius: 10px; }
    .pipeline strong { display: block; margin-bottom: 3px; }
    .grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: 16px; align-items: start; }
    .card { border: 1px solid var(--border-color-default, #d0d7de); border-radius: 12px; background: var(--background-color-default, #fff); overflow: hidden; }
    .card-head { padding: 16px 18px; border-bottom: 1px solid var(--border-color-default, #d0d7de); display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .card-body { padding: 18px; }
    .stage { color: var(--true-color-blue, #0969da); font-size: 12px; font-weight: var(--font-weight-semibold, 600); text-transform: uppercase; letter-spacing: .05em; }
    label.field { display: block; font-weight: var(--font-weight-semibold, 600); margin: 16px 0 6px; }
    textarea { width: 100%; min-height: 82px; resize: vertical; padding: 10px 12px; color: inherit; background: var(--background-color-default, #fff); border: 1px solid var(--border-color-default, #d0d7de); border-radius: 8px; }
    .context-list { display: grid; gap: 8px; }
    .context-item { display: grid; grid-template-columns: auto 1fr; gap: 10px; padding: 11px; border: 1px solid var(--border-color-default, #d0d7de); border-radius: 8px; }
    .context-item input { margin-top: 4px; }
    .provenance { display: inline-block; margin-top: 5px; padding: 2px 7px; border-radius: 999px; background: var(--true-color-blue-muted, #ddf4ff); color: var(--text-color-default, #1f2328); font-size: 11px; }
    .context-content { min-height: 64px; margin-top: 8px; font-family: var(--font-mono, Consolas, monospace); font-size: var(--text-code-inline, 12px); }
    .actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
    button { cursor: pointer; border: 1px solid var(--border-color-default, #d0d7de); border-radius: 7px; padding: 8px 12px; color: inherit; background: var(--background-color-default, #fff); font-weight: var(--font-weight-semibold, 600); }
    button.primary { color: var(--color-white, #fff); background: var(--true-color-blue, #0969da); border-color: transparent; }
    button.danger { color: var(--true-color-red, #cf222e); }
    button:disabled { cursor: not-allowed; opacity: .5; }
    .preview { margin-top: 14px; padding: 12px; background: var(--background-color-muted, rgba(175,184,193,.12)); border-radius: 8px; white-space: pre-wrap; overflow-wrap: anywhere; }
    .status-row { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .status { padding: 3px 8px; border-radius: 999px; background: var(--true-color-blue-muted, #ddf4ff); font-size: 12px; }
    .progress { height: 8px; margin: 14px 0; border-radius: 999px; overflow: hidden; background: var(--background-color-muted, rgba(175,184,193,.2)); }
    .progress > div { height: 100%; background: var(--true-color-blue, #0969da); transition: width .2s ease; }
    .identity { display: grid; gap: 7px; margin: 14px 0; }
    .identity div { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border-color-default, #d0d7de); padding-bottom: 6px; }
    .notice { margin-top: 12px; padding: 10px; border-left: 3px solid var(--true-color-blue, #0969da); background: var(--true-color-blue-muted, #ddf4ff); }
    .error { margin-top: 12px; padding: 10px; border-left: 3px solid var(--true-color-red, #cf222e); background: var(--true-color-red-muted, #ffebe9); white-space: pre-wrap; }
    .output-card { margin-top: 16px; }
    .output-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .output-section { min-height: 150px; padding: 14px; border: 1px solid var(--border-color-default, #d0d7de); border-radius: 9px; }
    .content { white-space: pre-wrap; overflow-wrap: anywhere; }
    .citations { margin: 16px 0 0; padding-left: 20px; }
    .citations a { color: var(--true-color-blue, #0969da); }
    @media (max-width: 800px) {
      .grid, .output-grid, .pipeline { grid-template-columns: 1fr; }
      .hero { flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header class="hero">
      <div>
        <h1>Foundry Canvas</h1>
        <p class="muted">Controlled context in. Existing Microsoft Foundry agent. Cited learning pack out.</p>
      </div>
      <div class="domain">demoId: <strong>${demoId}</strong></div>
    </header>

    <section class="pipeline" aria-label="Three-stage flow">
      <div><strong>1. Input Context</strong><span class="muted">Select, exclude, edit, preview</span></div>
      <div><strong>2. Agent / Skill Processing</strong><span class="muted">Authenticate, invoke, track</span></div>
      <div><strong>3. Generated Integration Output</strong><span class="muted">Review grounded study assets</span></div>
    </section>

    <div class="grid">
      <section id="input-stage" class="card">
        <div class="card-head"><div><div class="stage">Stage 1</div><h2>Input Context</h2></div><span class="status">Explicit only</span></div>
        <div class="card-body">
          <label class="field" for="request">User request</label>
          <textarea id="request"></textarea>
          <label class="field">Selected context</label>
          <div id="contexts" class="context-list"></div>
          <label class="field" for="constraints">Constraints <span class="muted">(one per line)</span></label>
          <textarea id="constraints"></textarea>
          <label class="field" for="exclusions">Exclusions <span class="muted">(one per line)</span></label>
          <textarea id="exclusions"></textarea>
          <label class="field" for="assumptions">Editable assumptions <span class="muted">(one per line)</span></label>
          <textarea id="assumptions"></textarea>
          <div class="notice"><strong>No implicit full-history transfer.</strong> Only checked items in the preview are sent.</div>
          <div class="actions"><button id="preview" class="primary">Preview context</button></div>
          <div id="preview-panel" class="preview" hidden></div>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><div><div class="stage">Stage 2</div><h2>Agent / Skill Processing</h2></div><span id="status" class="status">Idle</span></div>
        <div class="card-body">
          <div class="identity">
            <div><span class="muted">Foundry account</span><strong>foundry-opt-australia-7tiitcffaqbty</strong></div>
            <div><span class="muted">Project</span><strong>optimization-demo-australia</strong></div>
            <div><span class="muted">Agent</span><strong>foundry-optimization-agent</strong></div>
            <div><span class="muted">Credential</span><strong>DefaultAzureCredential</strong></div>
          </div>
          <div class="status-row"><span id="status-message">Preview context before sending</span><span id="progress-label">0%</span></div>
          <div class="progress" aria-label="Agent progress"><div id="progress-bar"></div></div>
          <div class="actions">
            <button id="run" class="primary" disabled>Run live agent</button>
            <button id="refresh">Refresh</button>
            <button id="reset" class="danger">Reset demo</button>
          </div>
          <div id="error" class="error" hidden></div>
        </div>
      </section>
    </div>

    <section class="card output-card">
      <div class="card-head"><div><div class="stage">Stage 3</div><h2>Generated Integration Output</h2></div><span id="generated" class="muted">Awaiting live response</span></div>
      <div class="card-body">
        <div class="output-grid">
          <article class="output-section"><h3>Key Points</h3><div id="key-points" class="content muted">No output yet.</div></article>
          <article class="output-section"><h3>Study Guide</h3><div id="study-guide" class="content muted">No output yet.</div></article>
          <article class="output-section"><h3>Flashcards</h3><div id="flashcards" class="content muted">No output yet.</div></article>
        </div>
        <h3 style="margin-top:18px">Citations &amp; provenance</h3>
        <ul id="citations" class="citations"><li class="muted">Citations from the live response will appear here.</li></ul>
      </div>
    </section>
  </main>
  <script>
    const demoId = ${jsonForScript(demoId)};
    let current;
    let busy = false;
    let dirty = false;
    const byId = (id) => document.getElementById(id);
    const lines = (value) => value.split(/\\r?\\n/).map((item) => item.trim()).filter(Boolean);
    const text = (element, value) => { element.textContent = value ?? ""; };

    function draft() {
      return {
        demoId,
        userRequest: byId("request").value,
        contextItems: current.contextItems.map((item) => ({
          ...item,
          content: byId("context-content-" + item.id).value,
          included: byId("context-" + item.id).checked,
        })),
        constraints: lines(byId("constraints").value),
        exclusions: lines(byId("exclusions").value),
        assumptions: lines(byId("assumptions").value),
      };
    }

    async function request(path, body) {
      const response = await fetch(path, {
        method: body === undefined ? "GET" : "POST",
        headers: body === undefined ? {} : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed");
      return payload;
    }

    function renderContexts(items) {
      const root = byId("contexts");
      root.replaceChildren(...items.map((item) => {
        const wrapper = document.createElement("label");
        wrapper.className = "context-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "context-" + item.id;
        checkbox.checked = item.included;
        const details = document.createElement("div");
        const title = document.createElement("strong");
        text(title, item.label);
        const provenance = document.createElement("span");
        provenance.className = "provenance";
        text(provenance, item.provenance);
        const content = document.createElement("textarea");
        content.id = "context-content-" + item.id;
        content.className = "context-content";
        content.setAttribute("aria-label", item.label + " content");
        content.value = item.content;
        details.append(title, document.createElement("br"), provenance, content);
        wrapper.append(checkbox, details);
        return wrapper;
      }));
    }

    function renderPreview(preview) {
      const panel = byId("preview-panel");
      panel.hidden = !preview;
      if (!preview) return;
      text(panel, [
        "REQUEST\\n" + preview.userRequest,
        "SELECTED CONTEXT\\n" + preview.contextItems.map((item) => "• " + item.label + " [" + item.provenance + "]").join("\\n"),
        "CONSTRAINTS\\n" + preview.constraints.map((item) => "• " + item).join("\\n"),
        "EXCLUSIONS\\n" + preview.exclusions.map((item) => "• " + item).join("\\n"),
        "ASSUMPTIONS\\n" + preview.assumptions.map((item) => "• " + item).join("\\n"),
        "TRANSFER POLICY\\n" + preview.transferPolicy,
        "Estimated payload: " + preview.estimatedCharacters.toLocaleString() + " characters",
      ].join("\\n\\n"));
    }

    function renderOutput(output) {
      text(byId("key-points"), output?.keyPoints || "No output yet.");
      text(byId("study-guide"), output?.studyGuide || "No output yet.");
      text(byId("flashcards"), output?.flashcards || "No output yet.");
      byId("key-points").classList.toggle("muted", !output);
      byId("study-guide").classList.toggle("muted", !output);
      byId("flashcards").classList.toggle("muted", !output);
      text(byId("generated"), output ? "Generated " + new Date(output.generatedAt).toLocaleString() : "Awaiting live response");
      const list = byId("citations");
      if (!output?.citations?.length) {
        const item = document.createElement("li");
        item.className = "muted";
        text(item, output ? "No URL citations were returned." : "Citations from the live response will appear here.");
        list.replaceChildren(item);
        return;
      }
      list.replaceChildren(...output.citations.map((citation) => {
        const item = document.createElement("li");
        const source = citation.url ? document.createElement("a") : document.createElement("span");
        if (citation.url) {
          source.href = citation.url;
          source.target = "_blank";
          source.rel = "noreferrer";
        }
        text(source, citation.title);
        const label = document.createElement("span");
        label.className = "muted";
        text(label, " — " + citation.provenance);
        item.append(source, label);
        return item;
      }));
    }

    function render(state, hydrateForm = false) {
      current = state;
      if (hydrateForm) {
        byId("request").value = state.userRequest;
        byId("constraints").value = state.constraints.join("\\n");
        byId("exclusions").value = state.exclusions.join("\\n");
        byId("assumptions").value = state.assumptions.join("\\n");
        renderContexts(state.contextItems);
      }
      text(byId("status"), state.processing.status.replaceAll("_", " "));
      text(byId("status-message"), state.processing.message);
      text(byId("progress-label"), state.processing.progress + "%");
      byId("progress-bar").style.width = state.processing.progress + "%";
      byId("run").disabled = busy || dirty || !state.preview || !state.preview.contextItems.length || state.processing.status === "running";
      byId("preview").disabled = busy;
      byId("error").hidden = !state.error;
      text(byId("error"), state.error);
      renderPreview(state.preview);
      renderOutput(state.output);
    }

    async function perform(action) {
      busy = true;
      render(current);
      try {
        const state = action === "preview"
          ? await request("/api/preview", draft())
          : await request("/api/" + action, {});
        if (action === "preview" || action === "reset" || action === "refresh") dirty = false;
        render(state, action === "reset" || action === "refresh");
      } catch (error) {
        byId("error").hidden = false;
        text(byId("error"), error.message);
      } finally {
        busy = false;
        render(current);
      }
    }

    byId("preview").addEventListener("click", () => perform("preview"));
    byId("run").addEventListener("click", () => perform("run"));
    byId("refresh").addEventListener("click", () => perform("refresh"));
    byId("reset").addEventListener("click", () => perform("reset"));
    byId("input-stage").addEventListener("input", () => {
      dirty = true;
      byId("run").disabled = true;
    });

    request("/api/state")
      .then((state) => render(state, true))
      .catch((error) => {
        byId("error").hidden = false;
        text(byId("error"), error.message);
      });

    const events = new EventSource("/events");
    events.addEventListener("state", (event) => render(JSON.parse(event.data)));
  </script>
</body>
</html>`;
}
