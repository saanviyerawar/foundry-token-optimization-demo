"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Braces, ChevronRight, Clock3, Cpu, Network, Search } from "lucide-react";
import type { Span, Trace } from "@/lib/types";
import { LoadingCard, PageHeader } from "./ui";

export function TracesClient() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [traceIndex, setTraceIndex] = useState(0);
  const [selected, setSelected] = useState<Span | null>(null);
  const [scrubber, setScrubber] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/traces").then((response) => response.json()).then((data: Trace[]) => { setTraces(data); setSelected(data[0]?.spans[1] ?? data[0]?.spans[0] ?? null); }).finally(() => setLoading(false)); }, []);
  const trace = traces[traceIndex];
  const timeline = useMemo(() => {
    if (!trace) return [];
    const origin = new Date(trace.spans[0].startedAt).getTime();
    const duration = Math.max(1, trace.spans[0].durationMs);
    const byId = new Map(trace.spans.map((span) => [span.id, span]));
    const depthOf = (span: Span) => {
      let depth = 0;
      let parentId = span.parentId;
      while (parentId && depth < 4) {
        depth += 1;
        parentId = byId.get(parentId)?.parentId;
      }
      return depth;
    };
    return trace.spans.map((span) => ({
      span,
      depth: depthOf(span),
      left: Math.max(0, ((new Date(span.startedAt).getTime() - origin) / duration) * 100),
      width: Math.max(2.5, (span.durationMs / duration) * 100),
    }));
  }, [trace]);
  function selectTrace(index: number) {
    setTraceIndex(index);
    setSelected(traces[index].spans[1] ?? traces[index].spans[0]);
    setScrubber(0);
  }
  function scrub(value: number) {
    setScrubber(value);
    if (!timeline.length) return;
    const nearest = timeline.reduce((best, item) => Math.abs(item.left - value) < Math.abs(best.left - value) ? item : best);
    setSelected(nearest.span);
  }
  return <>
    <PageHeader eyebrow="End-to-end observability" title="Inspect a dense span waterfall, then open the exact payload." description="The trace view aligns nested orchestration, retrieval, MCP, model, and response spans against one clock. Select a bar or scrub through time to inspect input, output, tokens, and metadata." />
    {loading ? <LoadingCard /> : !trace ? <div className="card empty">Generate a routed request to create a trace.</div> : <>
      <div className="trace-toolbar card">
        <div><Search size={15} /><select value={traceIndex} onChange={(event) => selectTrace(Number(event.target.value))}>{traces.map((item, index) => <option value={index} key={item.id}>{item.id.slice(0, 46)} · {item.status}</option>)}</select></div>
        <span className="pill"><Clock3 size={13} />{trace.spans[0].durationMs} ms</span>
        <span className="pill"><Network size={13} />{trace.spans.length} spans</span>
        <span className="pill"><Activity size={13} />{trace.spans.reduce((sum, span) => sum + span.inputTokens + span.outputTokens, 0)} tokens</span>
        <span className={`pill ${trace.status === "success" ? "success" : "danger"}`}>{trace.status}</span>
      </div>
      <section className="section trace-console">
        <div className="card waterfall-panel">
          <div className="waterfall-header"><div>Span</div><div className="waterfall-axis"><span>0 ms</span><span>25%</span><span>50%</span><span>75%</span><span>{trace.spans[0].durationMs} ms</span></div></div>
          <div className="waterfall-body">{timeline.map(({ span, depth, left, width }) => <button className={`waterfall-row ${span.parentId ? "child" : ""} ${selected?.id === span.id ? "selected" : ""}`} onClick={() => setSelected(span)} key={span.id}>
            <div className="span-label" style={{ paddingLeft: `${14 + depth * 20}px` }}>{span.parentId && <ChevronRight size={13} />}<span><strong>{span.name}</strong><small>{span.model ?? "local orchestration"} · {span.inputTokens + span.outputTokens} tok</small></span></div>
            <div className="span-track"><span className="span-bar" style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}><em>{span.durationMs} ms</em></span></div>
          </button>)}</div>
          <div className="time-scrubber"><div className="scrubber-line"><span style={{ left: `${scrubber}%` }} /></div><input aria-label="Trace time scrubber" type="range" min="0" max="100" value={scrubber} onChange={(event) => scrub(Number(event.target.value))} /><div><span>Trace start</span><strong>{Math.round((scrubber / 100) * trace.spans[0].durationMs)} ms</strong><span>Trace end</span></div></div>
        </div>
        <div className="card span-inspector">{selected ? <><div className="inspector-head"><div><div className="eyebrow">Selected span</div><h2>{selected.name}</h2></div><Braces size={18} /></div><div className="inspector-metrics"><div><span>Duration</span><strong>{selected.durationMs} ms</strong></div><div><span>Model</span><strong>{selected.model ?? "n/a"}</strong></div><div><span>Input</span><strong>{selected.inputTokens} tok</strong></div><div><span>Output</span><strong>{selected.outputTokens} tok</strong></div></div><div className="payload-tabs"><span className="active">Input / output</span><span>Metadata</span></div><div className="payload-section"><span className="label">Input</span><pre className="code-panel">{selected.input}</pre></div><div className="payload-section"><span className="label">Output</span><pre className="code-panel">{selected.output}</pre></div><div className="payload-section"><span className="label">Metadata</span><pre className="code-panel">{JSON.stringify(selected.metadata, null, 2)}</pre></div></> : <div className="empty"><Cpu />Select a span</div>}</div>
      </section>
    </>}
  </>;
}
