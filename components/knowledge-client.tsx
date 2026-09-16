"use client";

import { useEffect, useState } from "react";
import { BookOpen, Check, ChevronRight, Database, FilePlus2, Files, Search, Settings2, Sparkles } from "lucide-react";
import type { KnowledgeDocument } from "@/lib/types";
import type { RetrievalResult } from "@/lib/retrieval";
import { LoadingCard, PageHeader } from "./ui";

export function KnowledgeClient() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [query, setQuery] = useState("What is the default context budget and how should tools be exposed?");
  const [results, setResults] = useState<RetrievalResult[]>([]);
  const [answer, setAnswer] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/knowledge").then((response) => response.json()).then(setDocuments).finally(() => setLoading(false)); }, []);
  async function retrieve() {
    setError("");
    const response = await fetch("/api/knowledge/retrieve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
    const data = await response.json();
    if (!response.ok) setError(data.error); else { setResults(data.results); setAnswer(data.answer); }
  }
  async function addDocument(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const response = await fetch("/api/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content }) });
    const data = await response.json();
    if (!response.ok) setError(data.error); else { setDocuments((current) => [...current, data]); setTitle(""); setContent(""); }
  }
  return <>
    <PageHeader eyebrow="Principle 3 · Retrieve content" title="Configure a compact knowledge source, then inspect what gets injected." description="Set the retrieval contract, choose the simulated model and reasoning effort, add approved local content, and expose ranked chunks before answer generation." />
    {loading ? <LoadingCard /> : <>
      <section className="knowledge-workspace">
        <aside className="card setup-steps">
          <div className="setup-title">Knowledge setup</div>
          {[
            ["1", "Details", "Name and purpose"],
            ["2", "Retrieval", "Model and instructions"],
            ["3", "Sources", `${documents.length} local documents`],
            ["4", "Test", "Inspect grounded context"],
          ].map(([number, label, detail], index) => <div className={`setup-step ${index === 2 ? "active" : index < 2 ? "complete" : ""}`} key={label}><span>{index < 2 ? <Check size={14} /> : number}</span><div><strong>{label}</strong><small>{detail}</small></div><ChevronRight size={14} /></div>)}
        </aside>
        <div className="card card-pad knowledge-config">
          <div className="section-head"><div><div className="eyebrow">Knowledge base definition</div><h2>Agent optimization policies</h2></div><span className="pill success"><Database size={13} />Local index ready</span></div>
          <div className="config-grid">
            <div><label className="label">Name</label><input className="field" defaultValue="Optimization policy knowledge" /></div>
            <div><label className="label">Description</label><input className="field" defaultValue="Approved token, tool, evaluation, and ROI guidance" /></div>
            <div><label className="label">Embedding / answer model</label><select className="field" defaultValue="gpt-4.1-mini"><option>gpt-4.1-mini</option><option>gpt-5-mini</option><option>gpt-5-nano</option></select></div>
            <div><label className="label">Reasoning effort</label><select className="field" defaultValue="low"><option>low</option><option>medium</option><option>high</option></select></div>
            <div className="config-wide"><label className="label">Retrieval instructions</label><textarea className="field" defaultValue="Retrieve at most three high-scoring chunks. Prefer approved policy text, preserve source titles, and decline to infer unsupported facts." /></div>
          </div>
          <div className="source-area">
            <div className="source-head"><div><Files size={18} /><span><strong>Local markdown and text sources</strong><small>Safe title/content ingestion; no arbitrary filesystem paths</small></span></div><span className="pill">{documents.length} indexed</span></div>
            <div className="source-list">{documents.map((document) => <div key={document.id}><BookOpen size={15} /><span><strong>{document.title}</strong><small>{document.content.replace(/^#+\s*/m, "").slice(0, 88)}…</small></span><span className="pill">{document.source}</span></div>)}</div>
            <form className="source-add" onSubmit={addDocument}><input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Document title" /><textarea className="field" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste approved markdown or text…" /><button className="button"><FilePlus2 size={15} />Add source</button></form>
          </div>
        </div>
      </section>
      <section className="section retrieval-lab">
        <div className="card card-pad retrieval-query"><div className="section-head"><div><div className="eyebrow">Test retrieval</div><h2>Grounding preview</h2></div><Settings2 className="accent" /></div><label className="label" htmlFor="query">Question</label><textarea className="field" id="query" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="button" onClick={retrieve}><Search size={16} />Retrieve and answer</button>{error && <div className="error">{error}</div>}{answer && <div className="answer-panel"><Sparkles size={17} /><div><span className="label">Simulated grounded answer</span><p>{answer}</p></div></div>}</div>
        <div className="card card-pad retrieved-context"><div className="section-head"><h2>Injected context</h2><span className="pill accent">{results.length || 0} / 3 chunks</span></div>{results.length ? results.map((result, index) => <article key={`${result.documentId}-${result.score}`}><span className="chunk-index">0{index + 1}</span><div><div className="section-head"><strong>{result.title}</strong><span className="pill">BM25 {result.score}</span></div><p>{result.chunk}</p></div></article>) : <div className="empty"><Search size={20} /><p>Run the seeded query to reveal ranked chunks and injected context.</p></div>}</div>
      </section>
    </>}
  </>;
}
