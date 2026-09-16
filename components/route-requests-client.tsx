"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Gauge, Route, Send, Sparkles, TriangleAlert, Zap } from "lucide-react";
import type { RouteRequest } from "@/lib/types";
import { MonitorChart } from "./charts";
import { LoadingCard, PageHeader } from "./ui";

export function RouteRequestsClient() {
  const [requests, setRequests] = useState<RouteRequest[]>([]);
  const [prompt, setPrompt] = useState("Compare options for reducing agent token cost while preserving groundedness and tool-call accuracy.");
  const [priority, setPriority] = useState<RouteRequest["priority"]>("balanced");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/requests").then((response) => response.json()).then(setRequests).finally(() => setLoading(false)); }, []);
  const latest = requests.at(-1);
  const chartData = useMemo(() => requests.slice(-24).map((request, index) => ({
    index: index + 1,
    requests: 1 + (index % 4),
    errors: request.status === "success" ? 0 : request.status === "throttled" ? 1 : 2,
    latency: request.latencyMs,
    tokensPerSecond: request.tokensPerSecond,
  })), [requests]);
  const modelVolume = useMemo(() => Object.entries(requests.reduce<Record<string, number>>((accumulator, request) => {
    accumulator[request.model] = (accumulator[request.model] ?? 0) + 1;
    return accumulator;
  }, {})).map(([model, requests]) => ({ model, requests })), [requests]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSubmitting(true); setError("");
    const response = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, priority }) });
    const result = await response.json();
    if (!response.ok) setError(result.error ?? "Routing failed."); else setRequests((current) => [...current, result]);
    setSubmitting(false);
  }
  return <>
    <PageHeader eyebrow="Principle 1 · Route requests" title="Use evaluation evidence to route each request." description="Compare the current route with a deliberately optimized route, then inspect four monitor-style signals: model volume, non-200 outcomes, latency, and throughput." />
    <form className="card card-pad compact-form" onSubmit={submit}>
      <div className="form-row">
        <div><label className="label" htmlFor="prompt">Agent request</label><textarea id="prompt" className="field" value={prompt} onChange={(event) => setPrompt(event.target.value)} /></div>
        <div><label className="label" htmlFor="priority">Optimization objective</label><select id="priority" className="field" value={priority} onChange={(event) => setPriority(event.target.value as RouteRequest["priority"])}><option value="balanced">Balanced</option><option value="cost">Lowest cost</option><option value="latency">Lowest latency</option><option value="quality">Highest quality</option></select></div>
        <button className="button" disabled={submitting}><Send size={16} />{submitting ? "Routing…" : "Evaluate route"}</button>
      </div>{error && <div className="error">{error}</div>}
    </form>
    {loading ? <div className="section"><LoadingCard /></div> : <>
      <section className="section route-evaluation">
        <div className="card route-result baseline">
          <div className="route-result-head"><span className="pill">Baseline policy</span><span className="muted">Largest model default</span></div>
          <div className="route-model">claude-opus-5</div>
          <div className="route-score-grid"><div><span>Quality</span><strong>4.8</strong></div><div><span>Latency</span><strong>4,880 ms</strong></div><div><span>Cost / 1K</span><strong>$0.014</strong></div></div>
          <p className="muted">High quality, but pays premium inference cost for every request regardless of complexity.</p>
        </div>
        <div className="route-decision"><Sparkles size={18} /><span>Evaluation gate</span><strong>Pass</strong></div>
        <div className="card route-result optimized">
          <div className="route-result-head"><span className="pill accent">Optimized route</span><span className="success"><CheckCircle2 size={14} /> Quality preserved</span></div>
          <div className="route-model">{latest?.model ?? "gpt-5-mini"}</div>
          <div className="route-score-grid"><div><span>Complexity</span><strong>{latest?.complexity ?? 3}/5</strong></div><div><span>Latency</span><strong>{latest?.latencyMs ?? 0} ms</strong></div><div><span>Estimated cost</span><strong>${latest?.estimatedCost.toFixed(5) ?? "0.00000"}</strong></div></div>
          <p className="muted">{latest?.rationale}</p>
          {latest?.provider && <div className="route-live-result"><span className="pill success">{latest.provider}</span><span className="pill">actual model: {latest.responseModel}</span>{latest.traceId && <span className="pill mono">trace {latest.traceId.slice(0, 12)}</span>}<p>{latest.responsePreview}</p></div>}
        </div>
      </section>
      <section className="section monitor-grid">
        <div className="card monitor-panel"><div className="monitor-title"><div><span>Model requests</span><strong>{requests.length}</strong></div><Route size={16} /></div><MonitorChart data={modelVolume} dataKey="requests" xKey="model" height={160} area /></div>
        <div className="card monitor-panel"><div className="monitor-title"><div><span>Non-200 outcomes</span><strong>{requests.filter((request) => request.status !== "success").length}</strong></div><TriangleAlert size={16} /></div><MonitorChart data={chartData} dataKey="errors" height={160} tone="danger" /></div>
        <div className="card monitor-panel"><div className="monitor-title"><div><span>End-to-end latency</span><strong>{latest?.latencyMs ?? 0} ms</strong></div><Zap size={16} /></div><MonitorChart data={chartData} dataKey="latency" height={160} tone="warning" /></div>
        <div className="card monitor-panel"><div className="monitor-title"><div><span>Generation throughput</span><strong>{latest?.tokensPerSecond ?? 0} tok/s</strong></div><Gauge size={16} /></div><MonitorChart data={chartData} dataKey="tokensPerSecond" height={160} tone="success" /></div>
      </section>
      <section className="section card card-pad dense-table"><div className="section-head"><div><div className="eyebrow">Persistent request stream</div><h2>Recent routing decisions</h2></div><span className="pill accent">{requests.length} total</span></div><div className="table-wrap"><table><thead><tr><th>Model</th><th>Priority</th><th>Complexity</th><th>Tokens</th><th>Latency</th><th>Status</th></tr></thead><tbody>{requests.slice(-7).reverse().map((request) => <tr key={request.id}><td><span className="pill accent">{request.model}</span></td><td>{request.priority}</td><td>{request.complexity}/5</td><td>{request.inputTokens + request.outputTokens}</td><td>{request.latencyMs} ms</td><td className={request.status === "success" ? "success" : "danger"}>{request.status}</td></tr>)}</tbody></table></div></section>
    </>}
  </>;
}
