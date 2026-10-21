// Deterministic attribute extraction from the Description column.
// REQUIREMENTS §6.6, §6.7, §6.8. Every function here is a pure rule;
// no inference, no defaults. If the description does not state it, the
// value is null (R1).

import type { Family, PartAttributes, RawValues } from '../../src/types';
import {
  canonicalise,
  DRIVE_SYNONYMS,
  FINISH_SYNONYMS,
  HEAD_SYNONYMS,
  MATERIAL_SYNONYMS,
  WASHER_SYNONYMS,
  inchesToMm,
  parseFractional,
} from './normalize';

// -- thread size ------------------------------------------------------------
// Metric: M followed by a number, NOT preceded by letter/digit, NOT followed
// by digit/dot (so M3x0.5 captures M3, M2.5 captures M2.5, and HM3 or M30 are
// rejected only when context demands).
// Imperial: <n>-<nn> or <n>/<nn>-<nn>, optionally #-prefixed, not preceded
// by digit/dot/slash.
export function extractThreadSize(description: string): string | null {
  if (!description) return null;

  // metric M3, M2.5
  const metric = description.match(/(?<![A-Za-z0-9])M(\d+(?:\.\d+)?)(?!\d|\.)/);
  if (metric) return `M${metric[1]}`;

  // imperial fractional thread: 1/4-20
  const fracImp = description.match(/(?<![0-9./])(\d+\/\d+-\d+)/);
  if (fracImp) {
    // reject anything whose "numerator" part is actually a plain diameter without a dash
    return fracImp[1];
  }

  // imperial number thread: 10-32, 6-32, #10-32
  const numImp = description.match(/(?<![0-9./A-Za-z-])#?(\d+)-(\d+)(?![0-9/])/);
  if (numImp) {
    const [, a, b] = numImp;
    const na = Number(a);
    const nb = Number(b);
    // Reject obvious non-thread patterns (year ranges, etc.) with weak heuristic:
    // thread first number is 1–20 typically, pitch second number is 10–80.
    if (na >= 0 && na <= 20 && nb >= 8 && nb <= 100) {
      return `${a}-${b}`;
    }
  }
  return null;
}

// -- thread pitch (mm) ------------------------------------------------------
// Only read from explicit M<n>[-x]<pitch> pairing or '<pitch>mm pitch'.
// Never from the thread size alone.
export function extractPitchMm(description: string): number | null {
  if (!description) return null;

  // M3-0.5, M3x0.5, M3 x 0.5
  let m = description.match(/M\d+(?:\.\d+)?[\s]*[-xX×][\s]*(0?\.\d+|\d\.\d+)/);
  if (m) return Number(m[1]);

  // explicit "<n>mm pitch" / ".45mm Pitch"
  m = description.match(/(\d*\.\d+|\d+)\s*mm\s*pitch/i);
  if (m) {
    const n = Number(m[1]);
    if (n > 0 && n < 1) return n;
  }
  return null;
}

// -- length (mm) ------------------------------------------------------------
export function extractLengthMm(
  description: string
): { mm: number; raw: string } | null {
  if (!description) return null;

  // 1) <n>mm (L|LG|long|length)
  let m = description.match(/(\d+(?:\.\d+)?)\s*mm\s*(?:L\b|LG\b|long\b|length\b)/i);
  if (m) return { mm: Number(m[1]), raw: m[0] };

  // 2) imperial fractional long: "5/8 inch Long", ".75in Length"
  m = description.match(
    /(\d+-\d+\/\d+|\d+\/\d+|\.\d+|\d+\.\d+|\d+)\s*(?:in|inch|")\s*(?:long|length|L\b)/i
  );
  if (m) {
    const inches = parseFractional(m[1]);
    if (inches !== null) return { mm: inchesToMm(inches), raw: m[0] };
  }

  // 3) M<n>[-<pitch>]X<n>MM  e.g. M3-0.5X8MM, M3x8MM
  m = description.match(
    /M\d+(?:\.\d+)?(?:[\s]*[-xX][\s]*\d*\.?\d+)?[\s]*[xX×][\s]*(\d+(?:\.\d+)?)\s*mm/i
  );
  if (m) return { mm: Number(m[1]), raw: m[0] };

  // 4) M<n> x <pitch> x <n> mm  e.g. "M3 x 0.5 x 6 mm"
  m = description.match(
    /M\d+(?:\.\d+)?\s*[xX×]\s*\d*\.?\d+\s*[xX×]\s*(\d+(?:\.\d+)?)\s*mm/i
  );
  if (m) return { mm: Number(m[1]), raw: m[0] };

  // 5) trailing <n>mm (last resort; only if nothing before matched and the
  //    rest of the description makes it credible that this is a length)
  m = description.match(/\b(\d+(?:\.\d+)?)\s*mm\b/i);
  if (m && /thread|length|long|screw|bolt/i.test(description)) {
    return { mm: Number(m[1]), raw: m[0] };
  }

  return null;
}

// -- washer dimensions ------------------------------------------------------
export function extractWasherDims(description: string): {
  innerDiameterMm: number | null;
  outerDiameterMm: number | null;
  thicknessMm: number | null;
  raw: RawValues;
} {
  const raw: RawValues = {};
  const inner = pickDim(description, 'ID');
  const outer = pickDim(description, 'OD');
  const thick = pickDim(description, 'THK|THICK|THICKNESS');
  if (inner) { raw.innerDiameterMm = inner.raw; }
  if (outer) { raw.outerDiameterMm = outer.raw; }
  if (thick) { raw.thicknessMm = thick.raw; }
  return {
    innerDiameterMm: inner?.mm ?? null,
    outerDiameterMm: outer?.mm ?? null,
    thicknessMm: thick?.mm ?? null,
    raw,
  };
}

function pickDim(desc: string, suffix: string): { mm: number; raw: string } | null {
  const re = new RegExp(
    `(\\d+(?:[.\\-/]\\d+)*(?:\\.\\d+)?)\\s*(mm|in|inch|")\\s*(?:${suffix})\\b`,
    'i'
  );
  const m = desc.match(re);
  if (!m) return null;
  const n = parseFractional(m[1]);
  if (n === null) return null;
  const unit = m[2].toLowerCase();
  const mm = unit === 'mm' ? n : inchesToMm(n);
  return { mm, raw: m[0] };
}

// -- family -----------------------------------------------------------------
export function extractFamily(partType: string, description: string): Family {
  const pt = (partType || '').toLowerCase();
  const d = (description || '').toLowerCase();
  // part-type first
  if (pt.includes('washer')) return 'washer';
  if (pt.includes('nut')) {
    if (/cage/.test(d)) return 'cage nut';
    return 'nut';
  }
  // description keywords
  if (/\bcage\b/.test(d) && /\b(nut|bolt|screw)\b/.test(d)) return 'cage nut';
  if (/\bstandoff\b/.test(d)) return 'standoff';
  if (/\bbolt\b/.test(d) && !/\bscrew\b/.test(d)) return 'bolt';
  return 'screw';
}

// -- packaging --------------------------------------------------------------
export function extractPackaging(description: string): {
  quantity: number | null;
  isKit: boolean;
} {
  const d = description || '';
  const isKit = /\bkit\b/i.test(d);
  // "(100 pieces)", "100 PACK", "100 count", "100 Pack"
  const m =
    d.match(/\((\d+)\s*(?:pieces|pcs|pack|count)\b/i) ||
    d.match(/\b(\d+)\s*(?:PACK|PK|PCS|COUNT|PIECES)\b/i) ||
    d.match(/\b(\d+)\s*(?:pieces|count)\b/i);
  return { quantity: m ? Number(m[1]) : null, isKit };
}

// -- integral washer, grade class ------------------------------------------
export function extractIntegralWasher(description: string): string | null {
  return canonicalise(description, WASHER_SYNONYMS);
}

export function extractGradeClass(description: string): string | null {
  const m =
    description.match(/\bgrade\s*(\d+(?:\.\d)?)\b/i) ||
    description.match(/\bclass\s*(\d+(?:\.\d)?)\b/i);
  if (!m) return null;
  return m[0].toLowerCase().replace(/\s+/, ' ');
}

// -- head/drive/material/finish (+ driveSize, materialGrade) ---------------
export function extractHeadType(description: string): string | null {
  return canonicalise(description, HEAD_SYNONYMS);
}
export function extractDriveType(description: string): string | null {
  return canonicalise(description, DRIVE_SYNONYMS);
}
export function extractDriveSize(description: string): string | null {
  const m = description.match(/\b(T\d{1,2}|PH[0-3])\b/);
  return m ? m[1].toUpperCase() : null;
}
export function extractMaterial(description: string): string | null {
  return canonicalise(description, MATERIAL_SYNONYMS);
}
export function extractMaterialGrade(description: string): string | null {
  const m = description.match(/\b(18-8|304|316|A2|A4|303|410)\b/);
  return m ? m[1] : null;
}
export function extractFinish(description: string): string | null {
  return canonicalise(description, FINISH_SYNONYMS);
}

// -- fitsScrewSize (washer) ------------------------------------------------
// threadSize ?? number ?? fractional diameter
export function extractFitsScrewSize(description: string): string | null {
  const thread = extractThreadSize(description);
  if (thread) return thread;
  // numeric size: "No. 10", "#8"
  const num = description.match(/(?:No\.\s*|#)(\d+)\b/i);
  if (num) return `#${num[1]}`;
  // fractional diameter: "1/2in", "5/16in"
  const frac = description.match(/\b(\d+\/\d+)\s*(?:in|inch|")/i);
  if (frac) return `${frac[1]}in`;
  return null;
}

export function extractWasherStyle(description: string): string | null {
  const w = canonicalise(description, WASHER_SYNONYMS);
  if (w) return w;
  if (/flat\b/i.test(description)) return 'flat washer';
  return null;
}

// -- composed entry point ---------------------------------------------------
export function extractAttributes(
  partType: string,
  description: string
): { attributes: PartAttributes; raw: RawValues } {
  const family = extractFamily(partType, description);
  const raw: RawValues = {};

  const threadSize = extractThreadSize(description);
  if (threadSize) raw.threadSize = threadSize;

  const pitch = extractPitchMm(description);
  if (pitch !== null) raw.threadPitchMm = String(pitch);

  const len = extractLengthMm(description);
  if (len) raw.lengthMm = len.raw;

  const wd = extractWasherDims(description);
  Object.assign(raw, wd.raw);

  const attributes: PartAttributes = {
    family,
    threadSize,
    threadPitchMm: pitch,
    lengthMm: family === 'washer' ? null : len?.mm ?? null,
    headType: family === 'washer' ? null : extractHeadType(description),
    driveType: family === 'washer' ? null : extractDriveType(description),
    driveSize: family === 'washer' ? null : extractDriveSize(description),
    material: extractMaterial(description),
    materialGrade: extractMaterialGrade(description),
    finish: extractFinish(description),
    gradeClass: extractGradeClass(description),
    integralWasher:
      family === 'washer' ? null : extractIntegralWasher(description),
    fitsScrewSize: family === 'washer' ? extractFitsScrewSize(description) : null,
    washerStyle: family === 'washer' ? extractWasherStyle(description) : null,
    innerDiameterMm: wd.innerDiameterMm,
    outerDiameterMm: wd.outerDiameterMm,
    thicknessMm: wd.thicknessMm,
  };

  return { attributes, raw };
}
