// Total, deterministic ordering. ARCHITECTURE §5, FR-12.

import type { LifecyclePhase, MatchResult, ResultVerdict } from '../types';

const VERDICT_RANK: Record<ResultVerdict, number> = {
  match: 0,
  review: 1,
  different: 2,
};

const PHASE_RANK: Record<LifecyclePhase, number> = {
  Production: 0,
  Preliminary: 1,
  Planning: 2,
  Prototype: 3,
  'End of Production': 4,
  Sunset: 5,
  Obsolete: 6,
};

function statedCount(r: MatchResult): number {
  let n = 0;
  for (const v of Object.values(r.part.attributes)) {
    if (v !== null && v !== undefined) n++;
  }
  return n;
}

export function rankResults(results: MatchResult[]): MatchResult[] {
  const copy = [...results];
  copy.sort((a, b) => {
    const dv = VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict];
    if (dv !== 0) return dv;
    const dp = PHASE_RANK[a.part.phase] - PHASE_RANK[b.part.phase];
    if (dp !== 0) return dp;
    const dm = b.part.manufacturers.length - a.part.manufacturers.length;
    if (dm !== 0) return dm;
    const ds = statedCount(b) - statedCount(a);
    if (ds !== 0) return ds;
    return a.part.gpn.localeCompare(b.part.gpn);
  });
  return copy;
}
