"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const axis = { fontSize: 11, fill: "var(--cp-text-muted)" };

export function VolumeChart({ data }: { data: Array<Record<string, string | number>> }) {
  return <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><CartesianGrid stroke="var(--cp-border)" vertical={false} /><XAxis dataKey="time" tick={axis} stroke="var(--cp-border)" /><YAxis tick={axis} stroke="var(--cp-border)" /><Tooltip contentStyle={{ background: "var(--cp-panel-strong)", border: "1px solid var(--cp-border)", borderRadius: 10, color: "var(--cp-text)" }} /><Area type="monotone" dataKey="requests" stroke="var(--cp-accent)" fill="var(--cp-accent-soft)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>;
}

export function ModelChart({ data }: { data: Array<Record<string, string | number>> }) {
  return <div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid stroke="var(--cp-border)" vertical={false} /><XAxis dataKey="model" tick={axis} stroke="var(--cp-border)" /><YAxis tick={axis} stroke="var(--cp-border)" /><Tooltip contentStyle={{ background: "var(--cp-panel-strong)", border: "1px solid var(--cp-border)", borderRadius: 10, color: "var(--cp-text)" }} /><Legend /><Bar dataKey="tokens" fill="var(--cp-accent)" radius={[6, 6, 0, 0]} /><Bar dataKey="latency" fill="var(--cp-border-strong)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}

export function RoutingChart({ data }: { data: Array<Record<string, string | number>> }) {
  return <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={data}><CartesianGrid stroke="var(--cp-border)" vertical={false} /><XAxis dataKey="index" tick={axis} stroke="var(--cp-border)" /><YAxis tick={axis} stroke="var(--cp-border)" /><Tooltip contentStyle={{ background: "var(--cp-panel-strong)", border: "1px solid var(--cp-border)", borderRadius: 10, color: "var(--cp-text)" }} /><Legend /><Line type="monotone" dataKey="tokensPerSecond" stroke="var(--cp-accent)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="errors" stroke="var(--cp-danger)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>;
}

export function MonitorChart({
  data,
  dataKey,
  xKey = "index",
  height = 170,
  tone = "accent",
  area = false,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  xKey?: string;
  height?: number;
  tone?: "accent" | "danger" | "success" | "warning" | "muted";
  area?: boolean;
}) {
  const color = `var(--cp-${tone === "muted" ? "border-strong" : tone})`;
  return <div style={{ width: "100%", height }}><ResponsiveContainer width="100%" height="100%">{area
    ? <AreaChart data={data}><CartesianGrid stroke="var(--cp-border)" vertical={false} /><XAxis dataKey={xKey} tick={axis} stroke="var(--cp-border)" /><YAxis tick={axis} stroke="var(--cp-border)" width={38} /><Tooltip contentStyle={{ background: "var(--cp-panel-strong)", border: "1px solid var(--cp-border)", borderRadius: 10, color: "var(--cp-text)" }} /><Area type="monotone" dataKey={dataKey} stroke={color} fill="var(--cp-accent-soft)" strokeWidth={2} /></AreaChart>
    : <LineChart data={data}><CartesianGrid stroke="var(--cp-border)" vertical={false} /><XAxis dataKey={xKey} tick={axis} stroke="var(--cp-border)" /><YAxis tick={axis} stroke="var(--cp-border)" width={38} /><Tooltip contentStyle={{ background: "var(--cp-panel-strong)", border: "1px solid var(--cp-border)", borderRadius: 10, color: "var(--cp-text)" }} /><Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} /></LineChart>}</ResponsiveContainer></div>;
}

export function CostChart({ data }: { data: Array<Record<string, string | number>> }) {
  return <div className="chart chart-large"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><CartesianGrid stroke="var(--cp-border)" vertical={false} /><XAxis dataKey="time" tick={axis} stroke="var(--cp-border)" /><YAxis tick={axis} stroke="var(--cp-border)" width={48} /><Tooltip contentStyle={{ background: "var(--cp-panel-strong)", border: "1px solid var(--cp-border)", borderRadius: 10, color: "var(--cp-text)" }} /><Area type="monotone" dataKey="cost" stroke="var(--cp-accent)" fill="var(--cp-accent-soft)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>;
}
