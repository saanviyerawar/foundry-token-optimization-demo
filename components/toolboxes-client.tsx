"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Boxes, CheckCircle2, Coins, Focus, PackageOpen, Shrink, Wrench } from "lucide-react";
import { tools, toolboxMetrics } from "@/lib/toolboxes";
import { PageHeader } from "./ui";

const concise = "You are a sales operations agent. Select the smallest relevant toolbox, retrieve policy facts when needed, execute only approved tools, and answer with sources.";
const bloated = `You are a highly capable enterprise sales operations assistant. You must always be helpful, accurate, safe, professional, comprehensive, concise, detailed, aware of policies, aware of tools, aware of customers, aware of opportunities, and aware of every possible exception. You have CRM search, CRM update, contact listing, policy search, document fetch, calendar availability, email drafting, analytics queries, chart rendering, incident lookup, support ticket creation, and specialist handoff capabilities. Carefully consider every tool on every turn and include all relevant context before responding.`;

export function ToolboxesClient() {
  const [toolbox, setToolbox] = useState("CRM");
  const metrics = useMemo(() => toolboxMetrics(toolbox), [toolbox]);
  const groups = [...new Set(tools.map((tool) => tool.toolbox))];
  const selectedTools = tools.filter((tool) => tool.toolbox === toolbox);
  return <>
    <PageHeader eyebrow="Principles 2 & 5 · Externalise and compress" title="Replace a wall of tool definitions with one focused toolbox." description="The same capabilities remain available, but context is progressively disclosed by domain. Compare input tokens, selection accuracy, and cost before and after compression." />
    <div className="toolbox-controls"><span className="label">Scenario</span><select className="field" value={toolbox} onChange={(event) => setToolbox(event.target.value)}>{groups.map((group) => <option value={group} key={group}>{group} operations</option>)}</select><span className="pill accent"><Boxes size={13} /> Progressive disclosure on</span></div>
    <section className="section compression-stage">
      <article className="card comparison-card">
        <div className="comparison-kicker"><Wrench size={16} />Individual tool definitions</div>
        <div className="comparison-token">{metrics.individualTokens.toLocaleString()}<span> input tokens</span></div>
        <p className="muted">Every schema is injected before the agent knows which business domain it needs.</p>
        <div className="tool-cloud">{tools.map((tool) => <span className="tool-chip" key={tool.name}>{tool.name}</span>)}</div>
        <div className="comparison-stats"><div><span>Definitions exposed</span><strong>{tools.length}</strong></div><div><span>Selection accuracy</span><strong>74%</strong></div><div><span>Relative cost</span><strong>1.00×</strong></div></div>
      </article>
      <div className="compression-arrow"><div><Shrink size={22} /><strong>−{metrics.savings}%</strong><span>context</span></div><ArrowRight size={28} /></div>
      <article className="card comparison-card selected">
        <div className="comparison-kicker"><PackageOpen size={16} />{toolbox} toolbox</div>
        <div className="comparison-token">{metrics.groupedTokens.toLocaleString()}<span> input tokens</span></div>
        <p className="muted">The router exposes one compact domain, then the model selects among a few relevant operations.</p>
        <div className="tool-stack">{selectedTools.map((tool) => <div key={tool.name}><CheckCircle2 size={15} /><span><strong className="mono">{tool.name}</strong><small>{tool.description}</small></span></div>)}</div>
        <div className="comparison-stats"><div><span>Definitions exposed</span><strong>{selectedTools.length}</strong></div><div><span>Selection accuracy</span><strong>94%</strong></div><div><span>Cost reduction</span><strong>{metrics.costReduction}%</strong></div></div>
      </article>
    </section>
    <section className="section impact-strip">
      <div><Shrink size={18} /><span>Input reduction</span><strong>{metrics.savings}%</strong></div>
      <div><Focus size={18} /><span>Accuracy lift</span><strong>+20 pts</strong></div>
      <div><Coins size={18} /><span>Estimated cost reduction</span><strong>{metrics.costReduction}%</strong></div>
      <div><Boxes size={18} /><span>Domains available</span><strong>{groups.length}</strong></div>
    </section>
    <section className="section"><div className="section-head"><div><div className="eyebrow">Principle 5</div><h2>Keep the prompt small by separating concerns</h2></div><span className="pill accent">Behavior · tools · knowledge</span></div><div className="compare prompt-compare"><div className="card card-pad"><div className="section-head"><h3>Before: instructions absorb everything</h3><span className="pill danger">~{Math.ceil(bloated.length / 4)} tokens</span></div><pre className="code-panel">{bloated}</pre></div><div className="card card-pad"><div className="section-head"><h3>After: durable behavior only</h3><span className="pill success">~{Math.ceil(concise.length / 4)} tokens</span></div><pre className="code-panel">{concise}</pre><div className="separation-row"><span><Boxes size={14} />Tools in toolboxes</span><span><PackageOpen size={14} />Facts in knowledge</span></div></div></div></section>
  </>;
}
