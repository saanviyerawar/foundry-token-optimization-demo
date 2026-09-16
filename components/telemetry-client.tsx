"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BadgeDollarSign, Clock3, DatabaseZap, Gauge, RotateCcw, Send, Sigma } from "lucide-react";
import type { TelemetrySummary } from "@/lib/types";
import { cacheComparison } from "@/lib/caching";
import { CostChart, MonitorChart } from "./charts";
import { LoadingCard, MetricCard, PageHeader } from "./ui";

export function TelemetryClient() {
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);
  const [count, setCount] = useState(25);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const cache = cacheComparison(100);
  const costTimeline = useMemo(() => {
    let accumulated = 0;
    return (telemetry?.overTime ?? []).map((point) => {
      accumulated += point.cost;
      return { ...point, cost: Number(accumulated.toFixed(5)) };
    });
  }, [telemetry]);
  useEffect(() => { fetch("/api/telemetry").then((response) => response.json()).then(setTelemetry).finally(() => setLoading(false)); }, []);
  async function generate() { setRunning(true); const response = await fetch("/api/telemetry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ count }) }); setTelemetry(await response.json()); setRunning(false); }
  async function reset() { setRunning(true); const response = await fetch("/api/reset", { method: "POST" }); const data = await response.json(); setTelemetry(data.telemetry); setRunning(false); }
  return <>
    <PageHeader eyebrow="Telemetry control room · Principle 4" title="Put cost, tokens, requests, and responsiveness on one operating canvas." description="Five headline signals anchor the view. A large estimated-cost timeline and compact token, request, and time-to-first-byte charts show what changed after routing, compression, retrieval, and caching." action={<button className="button secondary" onClick={reset}><RotateCcw size={15} />Reset seed</button>} />
    <div className="card telemetry-controls"><div><label className="label" htmlFor="load">Generate controlled load</label><input id="load" type="range" min="5" max="100" step="5" value={count} onChange={(event) => setCount(Number(event.target.value))} /><strong>{count} requests</strong></div><span className="pill accent">Persistent JSON telemetry</span><button className="button" onClick={generate} disabled={running}><Send size={16} />{running ? "Generating…" : "Generate load"}</button></div>
    {loading || !telemetry ? <div className="section"><LoadingCard /></div> : <>
      <div className="section metric-grid-five"><MetricCard label="Total requests" value={telemetry.totalRequests} delta="+ simulated workload" icon={Activity} /><MetricCard label="Total tokens" value={telemetry.totalTokens.toLocaleString()} delta={`${telemetry.inputTokens.toLocaleString()} input`} icon={Sigma} /><MetricCard label="Estimated cost" value={`$${telemetry.estimatedCost.toFixed(4)}`} delta="mock blended rates" icon={BadgeDollarSign} /><MetricCard label="Cache savings" value={`${telemetry.cacheSavings.toLocaleString()}`} delta="input tokens avoided" icon={DatabaseZap} /><MetricCard label="Average latency" value={`${telemetry.averageLatency} ms`} delta={`${telemetry.byModel.length} models active`} icon={Clock3} /></div>
      <section className="section card cost-panel"><div className="section-head"><div><div className="eyebrow">Estimated solution cost</div><h2>Accumulated inference cost over time</h2></div><div className="cost-summary"><span>Current estimate</span><strong>${telemetry.estimatedCost.toFixed(4)}</strong></div></div><CostChart data={costTimeline} /></section>
      <section className="section telemetry-chart-grid">
        <div className="card monitor-panel"><div className="monitor-title"><div><span>Total tokens</span><strong>{telemetry.totalTokens.toLocaleString()}</strong></div><Gauge size={16} /></div><MonitorChart data={telemetry.overTime} dataKey="tokens" xKey="time" height={170} area /></div>
        <div className="card monitor-panel"><div className="monitor-title"><div><span>Request volume</span><strong>{telemetry.totalRequests}</strong></div><Activity size={16} /></div><MonitorChart data={telemetry.overTime} dataKey="requests" xKey="time" height={170} tone="success" /></div>
        <div className="card monitor-panel"><div className="monitor-title"><div><span>Time to first byte</span><strong>{Math.round(telemetry.averageLatency * 0.34)} ms</strong></div><Clock3 size={16} /></div><MonitorChart data={telemetry.overTime} dataKey="timeToFirstByte" xKey="time" height={170} tone="warning" /></div>
      </section>
    </>}
    <section className="section cache-comparison"><div className="section-head"><div><div className="eyebrow">Explicit cache comparison</div><h2>Stable prefixes and repeated meanings become reusable assets</h2></div><span className="pill accent">100 comparable requests</span></div><div className="grid grid-3"><div className="card card-pad"><h3>No cache</h3><div className="metric-value">{cache.noCacheTokens.toLocaleString()}</div><p className="muted">Every request pays for stable instructions and full inference.</p></div><div className="card card-pad selected-cache"><h3>Prompt-prefix cache</h3><div className="metric-value">{cache.prefixCacheTokens.toLocaleString()}</div><p className="muted">{cache.prefixSaved.toLocaleString()} input tokens avoided by reusing a 620-token stable prefix.</p></div><div className="card card-pad"><h3>Response / semantic cache</h3><div className="metric-value">{cache.responseCacheTokens.toLocaleString()}</div><p className="muted">{cache.semanticHits} equivalent requests served without model inference.</p></div></div></section>
  </>;
}
