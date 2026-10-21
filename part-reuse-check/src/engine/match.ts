// Verdict engine. FR-11.

import type {
  Answer,
  AttributeComparison,
  AttributeKey,
  MatchResult,
  PartRecord,
  Query,
  StepDefinition,
} from '../types';

const EPS = 0.001;

function equal(a: string | number | null, b: string | number | null): boolean {
  if (a === null || b === null) return false;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < EPS;
  return String(a) === String(b);
}

export function compareAttribute(
  key: AttributeKey,
  asked: Answer | undefined,
  found: string | number | null
): AttributeComparison {
  if (!asked || asked.state !== 'answered') {
    return { key, asked: null, found, verdict: 'not-asked' };
  }
  if (found === null || found === undefined) {
    return { key, asked: asked.value, found: null, verdict: 'unknown' };
  }
  return {
    key,
    asked: asked.value,
    found,
    verdict: equal(asked.value, found) ? 'match' : 'differs',
  };
}

export function matchPart(
  part: PartRecord,
  query: Query,
  steps: StepDefinition[]
): MatchResult {
  const comparisons: AttributeComparison[] = [];
  for (const step of steps) {
    if (step.key === ('__scope__' as AttributeKey) || step.key === ('__review__' as AttributeKey)) continue;
    const found = (part.attributes as any)[step.key] as string | number | null;
    const cmp = compareAttribute(step.key, query.answers[step.key], found);
    comparisons.push(cmp);
  }

  const disqualifying = new Set(
    steps.filter((s) => s.disqualifying).map((s) => s.key)
  );

  const differingKeys = comparisons
    .filter((c) => c.verdict === 'differs' && disqualifying.has(c.key))
    .map((c) => c.key);
  const unknownKeys = comparisons
    .filter((c) => c.verdict === 'unknown')
    .map((c) => c.key);

  let verdict: MatchResult['verdict'];
  let exclusionReason: string | null = null;
  if (differingKeys.length > 0) {
    verdict = 'different';
    const first = comparisons.find(
      (c) => c.verdict === 'differs' && disqualifying.has(c.key)
    )!;
    exclusionReason = `${labelFor(first.key)} ${formatVal(first.found)}, asked ${formatVal(first.asked)}`;
  } else if (unknownKeys.length > 0) {
    verdict = 'review';
  } else {
    // if nothing was asked beyond family, this is still a match
    verdict = 'match';
  }

  return { part, verdict, comparisons, unknownKeys, differingKeys, exclusionReason };
}

export function matchAll(
  parts: PartRecord[],
  query: Query,
  steps: StepDefinition[]
): MatchResult[] {
  return parts.map((p) => matchPart(p, query, steps));
}

function formatVal(v: string | number | null): string {
  if (v === null) return 'unknown';
  if (typeof v === 'number') return `${v}mm`;
  return String(v);
}

const PRETTY: Partial<Record<AttributeKey, string>> = {
  threadSize: 'thread',
  threadPitchMm: 'pitch',
  lengthMm: 'length',
  headType: 'head',
  driveType: 'drive',
  material: 'material',
  finish: 'finish',
  integralWasher: 'washer feature',
  gradeClass: 'grade',
  innerDiameterMm: 'ID',
  outerDiameterMm: 'OD',
  thicknessMm: 'thickness',
  fitsScrewSize: 'fits',
  washerStyle: 'style',
  family: 'family',
};
export function labelFor(key: AttributeKey): string {
  return PRETTY[key] ?? key;
}
