import { NextRequest, NextResponse } from "next/server";
import { groundedAnswer, retrieve } from "@/lib/retrieval";
import { readData } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const body = await request.json() as { query?: unknown };
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 1000) : "";
  if (query.length < 2) return NextResponse.json({ error: "Enter a retrieval query." }, { status: 400 });
  const results = retrieve(query, (await readData()).knowledge);
  return NextResponse.json({ query, results, answer: groundedAnswer(query, results) });
}
