import Link from "next/link";
import { ArrowRight, BadgeDollarSign, BookOpenCheck, Boxes, ChartNoAxesCombined, DatabaseZap, Route, ScanSearch, Sparkles } from "lucide-react";
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
    <PageHeader eyebrow="Guided storyline · 12–15 minutes" title="Optimize the business process, not just the prompt." description="A controlled, persistent simulation of model routing, tool compression, grounded retrieval, caching, simplification, traces, telemetry, and evaluation-driven development." action={<Link className="button" href="/evaluations">Start with the quality gate <ArrowRight size={16} /></Link>} />
    <div className="grid grid-3">
      <div className="card card-pad"><BadgeDollarSign className="accent" /><h2 style={{ marginTop: 16 }}>Business ROI</h2><div className="metric-value">Value − Costs</div><p className="muted">Time saved, faster cycles, avoided rework and conversion lift minus model, tools, retrieval, observability and operations.</p></div>
      <div className="card card-pad"><BookOpenCheck className="accent" /><h2 style={{ marginTop: 16 }}>Evaluation-driven</h2><div className="metric-value">Evidence first</div><p className="muted">Use quality gates to decide when smaller models, shorter prompts, and compressed context are safe.</p></div>
      <div className="card card-pad"><ChartNoAxesCombined className="accent" /><h2 style={{ marginTop: 16 }}>Observable</h2><div className="metric-value">Every token traced</div><p className="muted">Connect requests, spans, models, tools, retrieval, cache hits, latency, errors, cost, and evaluator outcomes.</p></div>
    </div>
    <section className="section card card-pad">
      <div className="section-head"><div><div className="eyebrow">Presenter preflight</div><h2>Define success before changing cost, latency, or context</h2></div><Link className="button secondary" href="/evaluations">Configure evaluation</Link></div>
      <p className="lede">Map the seeded dataset, select agent, quality, and safety evaluators, and set the release threshold. Every optimization that follows must preserve this gate.</p>
    </section>
    <section className="section">
      <div className="section-head"><div><div className="eyebrow">Five optimization principles</div><h2>Follow the sequence</h2></div><span className="pill accent">Controlled simulation</span></div>
      <div className="grid grid-2">{steps.map(({ title, text, href, icon: Icon }, index) => <article className="card story-step" key={title}><div className="story-number">{index + 1}</div><Icon size={20} className="accent" /><h2 style={{ marginTop: 10 }}>{title}</h2><p className="muted">{text}</p><Link className="button ghost" href={href}>Open demonstration <ArrowRight size={15} /></Link></article>)}</div>
    </section>
    <section className="section card card-pad">
      <div className="section-head"><div><div className="eyebrow">Wrap-up</div><h2>One operating loop</h2></div><Link className="button secondary" href="/evaluations">Run quality gates</Link></div>
      <p className="lede">Measure → route → reduce context → retrieve precisely → cache repeats → simplify → evaluate → observe → repeat. The result is a reliable agent whose unit economics improve without treating quality as an assumption.</p>
    </section>
  </>;
}
