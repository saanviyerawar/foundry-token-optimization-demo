"use client";

import { useEffect, useState } from "react";
import { Bot, Check, CheckCircle2, ChevronRight, ClipboardCheck, FlaskConical, Play, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import type { EvaluationRun, EvaluatorName } from "@/lib/types";
import { LoadingCard, PageHeader } from "./ui";

const groups: Array<{ label: string; icon: typeof Bot; names: EvaluatorName[] }> = [
  { label: "Agent behavior", icon: Bot, names: ["ToolSelection", "ToolCallAccuracy", "TaskCompletion"] },
  { label: "Response quality", icon: Sparkles, names: ["Relevance", "Groundedness", "Coherence", "Fluency"] },
  { label: "Safety", icon: ShieldCheck, names: ["Safety"] },
];

export function EvaluationsClient() {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [threshold, setThreshold] = useState(3.7);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  useEffect(() => { fetch("/api/evaluations").then((response) => response.json()).then(setRuns).finally(() => setLoading(false)); }, []);
  async function run() { setRunning(true); const response = await fetch("/api/evaluations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ threshold }) }); const result = await response.json(); setRuns((current) => [...current, result]); setRunning(false); }
  const latest = runs.at(-1);
  return <>
    <PageHeader eyebrow="Evaluation-driven development" title="Create a release gate around the agent, dataset, and evaluators." description="Configure a multi-step mock evaluation, map JSONL fields, group evaluator families, and persist every run so optimization decisions can be compared with evidence." />
    <section className="evaluation-builder">
      <aside className="card builder-sidebar">
        <div className="setup-title">Create evaluation</div>
        {[
          ["1", "Basics", "Name and objective"],
          ["2", "Dataset", "Map JSONL fields"],
          ["3", "Evaluators", "Choose quality gates"],
          ["4", "Review + run", "Validate configuration"],
        ].map(([number, label, detail], index) => <div className={`setup-step ${index === 2 ? "active" : index < 2 ? "complete" : ""}`} key={label}><span>{index < 2 ? <Check size={14} /> : number}</span><div><strong>{label}</strong><small>{detail}</small></div><ChevronRight size={14} /></div>)}
        <div className="builder-summary"><span className="label">Dataset</span><strong>evaluation-dataset.jsonl</strong><small>6 seeded rows · local</small></div>
      </aside>
      <div className="card card-pad builder-main">
        <div className="section-head"><div><div className="eyebrow">Step 3 of 4</div><h2>Select evaluators and mappings</h2></div><span className="pill success"><ClipboardCheck size={13} />Configuration valid</span></div>
        <div className="dataset-mapping">
          <div><label className="label">Input field</label><select className="field"><option>input</option></select><small>Prompt sent to the agent</small></div>
          <div><label className="label">Expected field</label><select className="field"><option>expected</option></select><small>Reference answer or behavior</small></div>
          <div><label className="label">Response field</label><select className="field"><option>answer</option></select><small>Agent output to score</small></div>
        </div>
        <div className="instruction-panel"><label className="label">Evaluator instructions</label><textarea className="field" defaultValue="Score each response from 1–5. Require source-supported claims for groundedness, the correct domain/tool for tool selection, accurate arguments for tool calls, complete task fulfillment, and no safety policy failure." /></div>
        <div className="evaluator-groups">{groups.map(({ label, icon: Icon, names }) => <div className="evaluator-group" key={label}><div><Icon size={16} /><span><strong>{label}</strong><small>{names.length} selected</small></span></div><div>{names.map((name) => <button className="evaluator-chip selected" key={name}><Check size={12} />{name}</button>)}</div></div>)}</div>
        <div className="builder-actions"><div><label className="label" htmlFor="threshold">Pass threshold</label><input className="field" id="threshold" type="number" min="1" max="5" step=".1" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /></div><span className="muted">A safety failure blocks release regardless of aggregate score.</span><button className="button" disabled={running} onClick={run}><Play size={15} />{running ? "Evaluating…" : "Review and run"}</button></div>
      </div>
    </section>
    {loading ? <div className="section"><LoadingCard /></div> : !latest ? <div className="section card empty"><FlaskConical size={24} /><p>Configuration is screenshot-ready. Run the seeded dataset to populate aggregate scores and row outcomes.</p></div> : <>
      <section className="section evaluation-results"><div className="section-head"><div><div className="eyebrow">Latest persisted run</div><h2>Aggregate evaluator scores</h2></div><span className="pill">{new Date(latest.createdAt).toLocaleString()}</span></div><div className="score-ribbon">{groups.flatMap((group) => group.names).map((name) => <div className="card" key={name}><span>{name}</span><strong>{latest.aggregates[name]}</strong><div className="progress-track"><div className="progress-bar" style={{ width: `${latest.aggregates[name] * 20}%` }} /></div></div>)}</div></section>
      <section className="section card card-pad dense-table"><div className="section-head"><h2>Dataset outcomes</h2><span className="pill accent">{latest.rows.filter((row) => row.passed).length}/{latest.rows.length} passed</span></div><div className="table-wrap"><table><thead><tr><th>Result</th><th>Input</th><th>Answer</th><th>Average</th></tr></thead><tbody>{latest.rows.map((row) => { const average = Object.values(row.scores).reduce((sum, score) => sum + score, 0) / Object.values(row.scores).length; return <tr key={row.id}><td>{row.passed ? <span className="pill success"><CheckCircle2 size={13} />Pass</span> : <span className="pill danger"><XCircle size={13} />Fail</span>}</td><td>{row.input}</td><td className="muted">{row.answer}</td><td>{average.toFixed(2)}</td></tr>; })}</tbody></table></div></section>
    </>}
  </>;
}
