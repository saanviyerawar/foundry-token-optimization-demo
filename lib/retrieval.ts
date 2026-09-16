import type { KnowledgeDocument } from "./types";

export interface RetrievalResult {
  documentId: string;
  title: string;
  chunk: string;
  score: number;
}

const terms = (value: string) =>
  value.toLowerCase().match(/[a-z0-9]+/g)?.filter((term) => term.length > 2) ?? [];

export function retrieve(query: string, documents: KnowledgeDocument[], limit = 3): RetrievalResult[] {
  const queryTerms = terms(query);
  if (!queryTerms.length) return [];
  const documentFrequency = new Map<string, number>();
  for (const term of new Set(queryTerms)) {
    documentFrequency.set(term, documents.filter((doc) => terms(doc.content).includes(term)).length);
  }
  return documents
    .flatMap((doc) =>
      doc.content
        .split(/\n\n+/)
        .filter(Boolean)
        .map((chunk) => {
          const chunkTerms = terms(chunk);
          const score = queryTerms.reduce((sum, term) => {
            const frequency = chunkTerms.filter((candidate) => candidate === term).length;
            const inverseDocumentFrequency = Math.log((documents.length + 1) / ((documentFrequency.get(term) ?? 0) + 0.5));
            return sum + frequency * Math.max(0.2, inverseDocumentFrequency);
          }, 0);
          return { documentId: doc.id, title: doc.title, chunk, score: Number(score.toFixed(3)) };
        }),
    )
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function groundedAnswer(query: string, results: RetrievalResult[]): string {
  if (!results.length) return `No grounded evidence was found for “${query}”. Add a relevant document or refine the query.`;
  const evidence = results.map((result) => result.chunk.replace(/^#+\s*/gm, "").trim()).join(" ");
  return `Grounded answer: ${evidence.slice(0, 420)}${evidence.length > 420 ? "…" : ""} [Sources: ${[...new Set(results.map((result) => result.title))].join(", ")}]`;
}
