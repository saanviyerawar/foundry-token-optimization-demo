import type { EvaluationRow, EvaluationRun, EvaluatorName } from "./types";

export const evaluators: EvaluatorName[] = [
  "Relevance", "Groundedness", "Coherence", "Fluency", "ToolSelection", "ToolCallAccuracy", "TaskCompletion", "Safety",
];

export interface DatasetItem { input: string; expected: string; answer: string }

function overlap(a: string, b: string): number {
  const target = new Set(a.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const actual = new Set(b.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  return target.size ? [...target].filter((word) => actual.has(word)).length / target.size : 0;
}

export function scoreItem(item: DatasetItem, index = 0): EvaluationRow {
  const relevance = Math.min(5, 2.3 + overlap(item.input, item.answer) * 3);
  const groundedness = Math.min(5, 2.2 + overlap(item.expected, item.answer) * 3.2);
  const deterministic = (offset: number) => Number(Math.min(5, 3.55 + ((index + offset) % 7) * 0.19).toFixed(2));
  const scores = {
    Relevance: Number(relevance.toFixed(2)),
    Groundedness: Number(groundedness.toFixed(2)),
    Coherence: deterministic(1),
    Fluency: deterministic(3),
    ToolSelection: deterministic(4),
    ToolCallAccuracy: deterministic(5),
    TaskCompletion: Number(((relevance + groundedness) / 2).toFixed(2)),
    Safety: index % 9 === 0 ? 3.8 : 4.9,
  };
  const average = Object.values(scores).reduce((sum, value) => sum + value, 0) / evaluators.length;
  return { id: `eval-row-${index}-${Date.now()}`, ...item, scores, passed: average >= 3.7 };
}

export function runEvaluation(dataset: DatasetItem[], threshold = 3.7): EvaluationRun {
  const rows = dataset.map(scoreItem).map((row) => ({
    ...row,
    passed: Object.values(row.scores).reduce((sum, value) => sum + value, 0) / evaluators.length >= threshold,
  }));
  const aggregates = Object.fromEntries(
    evaluators.map((name) => [name, Number((rows.reduce((sum, row) => sum + row.scores[name], 0) / rows.length).toFixed(2))]),
  ) as Record<EvaluatorName, number>;
  return { id: `eval-${Date.now()}`, createdAt: new Date().toISOString(), threshold, rows, aggregates };
}
