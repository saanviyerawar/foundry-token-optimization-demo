import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Foundry Agent Optimization Companion",
  description: "The workload generator and visualization companion for a portal-first Microsoft Foundry optimization walkthrough.",
};

const themeScript = '(() => { const param = new URLSearchParams(window.location.search).get("clawpilotTheme"); const theme = param || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); document.documentElement.setAttribute("data-theme", theme); })();';

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><AppShell runtimeMode={(process.env.AI_PROVIDER ?? "mock").toLowerCase()}>{children}</AppShell></body>
    </html>
  );
}
