import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { runEvaluation, type DatasetItem } from "@/lib/evaluations";
import { readData, updateData } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json((await readData()).evaluations);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { threshold?: unknown };
  const threshold = Math.min(5, Math.max(1, Number(body.threshold ?? 3.7)));
  const raw = await fs.readFile(path.join(process.cwd(), "data", "evaluation-dataset.jsonl"), "utf8");
  const dataset = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as DatasetItem);
  const run = runEvaluation(dataset, threshold);
  await updateData((data) => { data.evaluations.push(run); });
  return NextResponse.json(run, { status: 201 });
}
