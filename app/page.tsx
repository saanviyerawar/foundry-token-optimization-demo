import Link from "next/link";
import { ArrowRight, BadgeDollarSign, BookOpenCheck, Boxes, ChartNoAxesCombined, DatabaseZap, ExternalLink, Route, ScanSearch, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui";

const steps = [
  { title: "Route every request intentionally", text: "Match task complexity to cost, latency, quality, and capacity rather than defaulting to the largest model.", href: "/route-requests", icon: Route },
  { title: "Compress the tool surface", text: "Progressively disclose grouped MCP toolboxes and measure context savings plus selection accuracy.", href: "/toolboxes", icon: Boxes },
  { title: "Retrieve only what matters", text: "Use local BM25-like retrieval to show the exact chunks injected into model context.", href: "/knowledge", icon: ScanSearch },
  { title: "Cache stable and repeated work", text: "Compare no cache, prompt-prefix cache, and response/semantic cache using visible token savings.", href: "/telemetry", icon: DatabaseZap },
  { title: "Simplify the agent", text: "Replace bloated instructions with a concise system prompt; move capabilities into toolboxes and facts into knowledge.", href: "/toolboxes", icon: Sparkles },
];

export default function HomePage() {
  return <>
    <PageHeader eyebrow="Foundry portal companion · 12–15 minutes" title="Optimize the business process, not just the prompt." description="Start in Microsoft Foundry. Use this companion to generate controlled traffic, expose optimization comparisons, and provide a deterministic fallback." action={<a className="button" href="https://ai.azure.com" target="_blank" rel="noreferrer">Open Microsoft Foundry <ExternalLink size={16} /></a>} />
    <section className="section card card-pad">
      <div className="section-head"><div><div className="eyebrow">Portal-first walkthrough</div><h2>Build, evaluate, trace, and monitor in Foundry</h2></div><Link className="button secondary" href="/route-requests">Generate workload <ArrowRight size={15} /></Link></div>
      <p className="lede">Keep the deployed Foundry project as the primary presentation screen. Open this application only when you need repeatable requests or a transparent before-and-after comparison.</p>
    </section>
    <div className="grid grid-3">
      <div className="card card-pad"><BadgeDollarSign className="accent" /><h2 style={{ marginTop: 16 }}>Business ROI</h2><div className="metric-value">Value − Costs</div><p className="muted">Time saved, faster cycles, avoided rework and conversion lift minus model, tools, retrieval, observability and operations.</p></div>
      <div className="card card-pad"><BookOpenCheck className="accent" /><h2 style={{ marginTop: 16 }}>Evaluation-driven</h2><div className="metric-value">Evidence first</div><p className="muted">Use quality gates to decide when smaller models, shorter prompts, and compressed context are safe.</p></div>
      <div className="card card-pad"><ChartNoAxesCombined className="accent" /><h2 style={{ marginTop: 16 }}>Observable</h2><div className="metric-value">Every token traced</div><p className="muted">Connect requests, spans, models, tools, retrieval, cache hits, latency, errors, cost, and evaluator outcomes.</p></div>
    </div>
    <section className="section card card-pad">
      <div className="section-head"><div><div className="eyebrow">Offline evaluation fallback</div><h2>Define success before changing cost, latency, or context</h2></div><Link className="button secondary" href="/evaluations">Open fallback evaluation</Link></div>
      <p className="lede">Run the primary evaluation in Foundry. This deterministic version mirrors the quality-gate discussion when tenant evaluation features or connectivity are unavailable.</p>
    </section>
    <section className="section">
      <div className="section-head"><div><div className="eyebrow">Five optimization principles</div><h2>Supporting comparisons</h2></div><span className="pill accent">Companion app</span></div>
      <div className="grid grid-2">{steps.map(({ title, text, href, icon: Icon }, index) => <article className="card story-step" key={title}><div className="story-number">{index + 1}</div><Icon size={20} className="accent" /><h2 style={{ marginTop: 10 }}>{title}</h2><p className="muted">{text}</p><Link className="button ghost" href={href}>Open demonstration <ArrowRight size={15} /></Link></article>)}</div>
    </section>
    <section className="section card card-pad">
      <div className="section-head"><div><div className="eyebrow">Wrap-up</div><h2>One operating loop</h2></div><Link className="button secondary" href="/evaluations">Run quality gates</Link></div>
      <p className="lede">Measure → route → reduce context → retrieve precisely → cache repeats → simplify → evaluate → observe → repeat. The result is a reliable agent whose unit economics improve without treating quality as an assumption.</p>
    </section>
  </>;
}
