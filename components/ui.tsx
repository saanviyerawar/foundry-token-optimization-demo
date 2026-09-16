import type { LucideIcon } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="lede">{description}</p></div>{action}</header>;
}

export function MetricCard({ label, value, delta, icon: Icon }: { label: string; value: string | number; delta?: string; icon?: LucideIcon }) {
  return <div className="card card-pad"><div className="section-head"><span className="metric-label">{label}</span>{Icon && <Icon size={18} className="accent" />}</div><div className="metric-value">{value}</div>{delta && <div className="metric-delta">{delta}</div>}</div>;
}

export function LoadingCard() {
  return <div className="card empty">Loading persistent simulation data…</div>;
}
