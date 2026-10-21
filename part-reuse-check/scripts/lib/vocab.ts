// Vocabulary assembly. For each AttributeKey that is a wizard step, collect
// distinct stated values with counts across the fixture. Builder-time only.

import type {
  AttributeKey,
  PartRecord,
  VocabOption,
  Vocabulary,
} from '../../src/types';
import {
  DRIVE_SYNONYMS,
  FINISH_SYNONYMS,
  HEAD_SYNONYMS,
  MATERIAL_SYNONYMS,
  WASHER_SYNONYMS,
} from './normalize';

const ENUM_KEYS: AttributeKey[] = [
  'family',
  'headType',
  'driveType',
  'material',
  'finish',
  'integralWasher',
  'washerStyle',
  'fitsScrewSize',
  'threadSize',
];

const NUMERIC_KEYS: AttributeKey[] = [
  'threadPitchMm',
  'lengthMm',
  'innerDiameterMm',
  'outerDiameterMm',
  'thicknessMm',
];

const ENUM_RAW_TABLES: Partial<Record<AttributeKey, Record<string, string[]>>> = {
  headType: HEAD_SYNONYMS,
  driveType: DRIVE_SYNONYMS,
  material: MATERIAL_SYNONYMS,
  finish: FINISH_SYNONYMS,
  integralWasher: WASHER_SYNONYMS,
  washerStyle: WASHER_SYNONYMS,
};

function enumLabel(key: AttributeKey, canonical: string): string {
  switch (key) {
    case 'family':
      return canonical;
    case 'headType':
      return canonical.endsWith('head') ? canonical : `${canonical} head`;
    case 'driveType':
      return canonical;
    case 'material':
      return canonical;
    case 'finish':
      return canonical;
    case 'integralWasher':
    case 'washerStyle':
      return canonical;
    case 'fitsScrewSize':
    case 'threadSize':
      return canonical;
    default:
      return canonical;
  }
}

export function buildVocabulary(parts: PartRecord[]): Vocabulary {
  const vocab: Vocabulary = {};

  // enums
  for (const key of ENUM_KEYS) {
    const counts = new Map<string, number>();
    for (const p of parts) {
      const v = (p.attributes as any)[key] as string | null;
      if (v === null || v === undefined || v === '') continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const table = ENUM_RAW_TABLES[key];
    const options: VocabOption[] = Array.from(counts.entries()).map(
      ([canonical, count]) => ({
        canonical,
        label: enumLabel(key, canonical),
        rawVariants: table?.[canonical] ?? [canonical],
        count,
      })
    );
    // count desc, then canonical asc
    options.sort((a, b) => b.count - a.count || a.canonical.localeCompare(b.canonical));
    if (options.length) vocab[key] = options;
  }

  // numerics
  for (const key of NUMERIC_KEYS) {
    const counts = new Map<number, number>();
    const raws = new Map<number, Set<string>>();
    for (const p of parts) {
      const v = (p.attributes as any)[key] as number | null;
      if (v === null || v === undefined || Number.isNaN(v)) continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
      const r = p.raw[key];
      if (r) {
        if (!raws.has(v)) raws.set(v, new Set());
        raws.get(v)!.add(r);
      }
    }
    const options: VocabOption[] = Array.from(counts.entries()).map(
      ([value, count]) => ({
        canonical: String(value),
        label: `${value} mm`,
        rawVariants: Array.from(raws.get(value) ?? []),
        count,
      })
    );
    options.sort((a, b) => Number(a.canonical) - Number(b.canonical));
    if (options.length) vocab[key] = options;
  }

  return vocab;
}
