import { NextRequest, NextResponse } from "next/server";
import { readData, updateData } from "@/lib/storage";
import type { KnowledgeDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json((await readData()).knowledge);
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { title?: unknown; content?: unknown };
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 20000) : "";
  if (title.length < 2 || content.length < 10) {
    return NextResponse.json({ error: "Provide a title and at least 10 characters of content." }, { status: 400 });
  }
  const safeId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "document";
  const document: KnowledgeDocument = {
    id: `${safeId}-${Date.now()}`,
    title,
    content,
    source: "user",
    createdAt: new Date().toISOString(),
  };
  await updateData((data) => { data.knowledge.push(document); });
  return NextResponse.json(document, { status: 201 });
}
