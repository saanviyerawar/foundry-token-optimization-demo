"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity, BookOpen, Boxes, Braces, ChartNoAxesCombined, FlaskConical, Gauge, Home, Route, Sparkles,
} from "lucide-react";

const links = [
  { href: "/", label: "Storyline", icon: Home },
  { href: "/evaluations", label: "01 · Evaluation gate", icon: FlaskConical },
  { href: "/route-requests", label: "02 · Route requests", icon: Route },
  { href: "/toolboxes", label: "03 · Externalise tools", icon: Boxes },
  { href: "/knowledge", label: "04 · Retrieve content", icon: BookOpen },
  { href: "/traces", label: "05 · Inspect traces", icon: Activity },
  { href: "/telemetry", label: "06 · Telemetry & cache", icon: ChartNoAxesCombined },
];

export function AppShell({ children, runtimeMode }: { children: React.ReactNode; runtimeMode: string }) {
  const pathname = usePathname();
  const [mode, setMode] = useState(runtimeMode);
  useEffect(() => {
    fetch("/api/runtime")
      .then((response) => response.json())
      .then((runtime: { mode?: string }) => { if (runtime.mode) setMode(runtime.mode); })
      .catch((error) => console.error("Unable to read runtime mode.", error));
  }, []);
  const isReal = mode === "foundry" || mode === "azure";
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={19} /></div>
          <div><div className="brand-title">Foundry Agent<br />Optimization Demo</div><div className="brand-subtitle">Controlled simulation</div></div>
        </div>
        <div className="nav-section">Demo flow</div>
        <nav>{links.map(({ href, label, icon: Icon }) => <Link className={`nav-link ${pathname === href ? "active" : ""}`} href={href} key={href}><Icon size={17} />{label}</Link>)}</nav>
        <div className="sidebar-note">
          <div className={`pill ${isReal ? "success" : "accent"}`}><Gauge size={13} /> {isReal ? `${mode} mode active` : "Mock mode active"}</div>
          <p className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{isReal ? "Real tenant calls use server-side managed identity. Local JSON remains the demo telemetry view." : "Deterministic local data. No Azure subscription or database required."}</p>
          <Link className="nav-link" href="/telemetry"><Braces size={16} />Open control room</Link>
        </div>
      </aside>
      <main className="main">{children}<div className="footer-note">Foundry-inspired, original simulation · JSON persistence · mock provider by default</div></main>
    </div>
  );
}
