// Candidate filtering. R2: inclusive — a record survives unless it STATES a
// different value for an answered attribute.
// ARCHITECTURE §5.

import type {
  AttributeKey,
  PartRecord,
  Query,
  Vocabulary,
  VocabOption,
} from '../types';

const EPS = 0.001;

function valuesEqual(
  a: string | number | null,
  b: string | number | null
): boolean {
  if (a === null || b === null) return false;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < EPS;
  return String(a) === String(b);
}

export function filterCandidates(
  parts: PartRecord[],
  query: Query
): PartRecord[] {
  const { scope, answers } = query;
  const strict = scope.strict;
  const allowKits = scope.allowKits;
  const phases = new Set(scope.phases);

  return parts.filter((p) => {
    if (!phases.has(p.phase)) return false;
    if (!allowKits && p.packaging.isKit) return false;

    for (const key of Object.keys(answers) as AttributeKey[]) {
      const ans = answers[key];
      if (!ans || ans.state !== 'answered') continue;
      const found = (p.attributes as any)[key] as string | number | null;
      if (found === null || found === undefined) {
        if (strict) return false; // strict: unknowns excluded
        continue; // inclusive: keep (R2)
      }
      if (!valuesEqual(found, ans.value)) return false;
    }
    return true;
  });
}

export function poolCounts(
  parts: PartRecord[],
  query: Query
): { total: number; exact: number; unknown: number } {
  const pool = filterCandidates(parts, query);
  let exact = 0;
  let unknown = 0;
  for (const p of pool) {
    let anyUnknown = false;
    for (const key of Object.keys(query.answers) as AttributeKey[]) {
      const ans = query.answers[key];
      if (!ans || ans.state !== 'answered') continue;
      const found = (p.attributes as any)[key] as string | number | null;
      if (found === null || found === undefined) anyUnknown = true;
    }
    if (anyUnknown) unknown++;
    else exact++;
  }
  return { total: pool.length, exact, unknown };
}

/**
 * Options for one step, counted within the pool AFTER applying answers EXCLUDING
 * this key. The step must not shrink its own option list.
 */
export function optionsForStep(
  parts: PartRecord[],
  query: Query,
  key: AttributeKey,
  vocab: Vocabulary
): VocabOption[] {
  const trimmedAnswers = { ...query.answers };
  delete trimmedAnswers[key];
  const pool = filterCandidates(parts, { ...query, answers: trimmedAnswers });
  const options = vocab[key] ?? [];
  const stated = new Map<string, number>();
  for (const p of pool) {
    const v = (p.attributes as any)[key] as string | number | null;
    if (v === null || v === undefined) continue;
    const k = String(v);
    stated.set(k, (stated.get(k) ?? 0) + 1);
  }
  return options
    .map((o) => ({ ...o, count: stated.get(o.canonical) ?? 0 }))
    .filter((o) => o.count > 0);
}
