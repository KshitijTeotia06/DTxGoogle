// Synonym tables & normalisation helpers.
// Variants are ordered longest-first inside each canonical so that
// multi-word tokens (`black oxide`, `stainless steel`) match before
// their shorter prefixes.  REQUIREMENTS §6.1–§6.5.

export const HEAD_SYNONYMS: Record<string, string[]> = {
  pan:          ['PANHEAD', 'PAN HEAD', 'PAN-HEAD', 'PAN HD', 'PHCS', 'PHP'],
  flat:         ['FLATHEAD', 'FLAT HEAD', 'FLAT HD', 'FHCS'],
  socket:       ['SOCKET HEAD', 'SHCS'],
  hex:          ['HEX HEAD'],
  truss:        ['TRUSS-HEAD', 'TRUSS HEAD'],
  'washer head':['WASHER HEAD'],
  button:       ['BUTTON HEAD', 'BHCS'],
  cap:          ['CAP HEAD'],
  oval:         ['OVAL HEAD'],
  round:        ['ROUND HEAD'],
  flange:       ['FLANGE HEAD'],
  'low profile':['LOW PROFILE HEAD'],
};

export const DRIVE_SYNONYMS: Record<string, string[]> = {
  phillips: ['PHILLIPS', 'PHILIPS', 'PHIL', 'PH1', 'PH2'],
  hex:      ['HEX SOCKET', 'HEX'],
  // Torx bit sizes count as torx drive; bit size is captured separately as driveSize.
  torx:     ['TORX', 'T10', 'T20', 'T25', 'T30'],
  square:   ['SQUARE'],
  slotted:  ['SLOTTED'],
  combo:    ['COMBO'],
};

// Order matters: alloy/carbon/spring/stainless steel must be tested BEFORE bare steel.
export const MATERIAL_SYNONYMS: Record<string, string[]> = {
  'stainless steel': [
    'STAINLESS STEEL', 'STAINLESS', 'SST', 'SS',
    '18-8', 'A4', 'A2', '316', '304', '410', '303',
  ],
  'alloy steel':   ['ALLOY STEEL'],
  'carbon steel':  ['CARBON STEEL'],
  'spring steel':  ['SPRING STEEL'],
  steel:           ['STEEL', 'STL'],
  nylon:           ['NYLON'],
  bronze:          ['BRONZE'],
  brass:           ['BRASS'],
  aluminum:        ['ALUMINIUM', 'ALUMINUM'],
  plastic:         ['PLASTIC'],
};

// black oxide / black zinc tested before bare black.
export const FINISH_SYNONYMS: Record<string, string[]> = {
  'zinc plated':       ['ZINC PLATED', 'CLEAR ZINC', 'ZINC', 'ZC', 'ZP', 'ZN'],
  'black oxide':       ['BLACK OXIDE'],
  'black zinc':        ['BLACK ZINC'],
  'hot dip galvanized':['HOT DIP GALVANIZED'],
  galvanized:          ['GALVANIZED'],
  passivated:          ['PASSIVATED'],
  cadmium:             ['CADMIUM'],
  nickel:              ['NICKEL'],
  phosphate:           ['PHOSPHATE'],
  tin:                 ['TIN'],
  plain:               ['PLAIN'],
  black:               ['BLACK'], // last-resort colour claim
};

export const WASHER_SYNONYMS: Record<string, string[]> = {
  'split lock':     ['SPRING LOCK', 'LOCK WASHER', 'SPLIT LOCK'],
  'external tooth': ['EXTERNAL-TOOTH', 'EXTERNAL TOOTH', 'EXT-TOOTH', 'EXT TOOTH'],
  'internal tooth': ['INTERNAL-TOOTH', 'INTERNAL TOOTH'],
  'square cone':    ['SQ CONICAL', 'SQUARE CONE', 'CONICAL'],
  'flat washer':    ['FLAT WASHER'],
  'captive/SEM':    ['W/ WASHER', 'WITH WASHER', 'W/WASHER', 'CAPTIVE', 'SEMS', 'SEM'],
  'nylon patch':    ['NYLON PATCH'],
};

/**
 * Match the first canonical whose variant appears in the text.
 * Variants are tried in declaration order (longest first per table).
 * Match is case-insensitive and anchored by non-word-alphanumeric boundaries,
 * so "18-8" is matched inside "SS, 18-8".
 */
export function canonicalise(
  text: string,
  table: Record<string, string[]>
): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();
  for (const canonical of Object.keys(table)) {
    for (const variant of table[canonical]) {
      if (containsVariant(upper, variant.toUpperCase())) return canonical;
    }
  }
  return null;
}

function containsVariant(upperHaystack: string, upperNeedle: string): boolean {
  const idx = upperHaystack.indexOf(upperNeedle);
  if (idx === -1) return false;
  const before = idx === 0 ? '' : upperHaystack[idx - 1];
  const after =
    idx + upperNeedle.length >= upperHaystack.length
      ? ''
      : upperHaystack[idx + upperNeedle.length];
  // Boundary = not an adjacent letter/digit on either side (allow -, /, _, spaces, punctuation).
  return !isAlnum(before) && !isAlnum(after);
}

function isAlnum(ch: string): boolean {
  if (!ch) return false;
  return /[A-Z0-9]/i.test(ch);
}

/** '5/8' -> 0.625 ; '1-1/2' -> 1.5 ; '.75' -> 0.75 ; '3' -> 3 ; else null */
export function parseFractional(text: string): number | null {
  if (!text) return null;
  const t = text.trim();
  // whole + fraction  e.g. 1-1/2 or 1 1/2
  let m = t.match(/^(\d+)[\s-](\d+)\/(\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  // plain fraction
  m = t.match(/^(\d+)\/(\d+)$/);
  if (m) return Number(m[1]) / Number(m[2]);
  // decimal (incl. .75)
  m = t.match(/^-?\.?\d+(\.\d+)?$|^\.\d+$/);
  if (m) {
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function inchesToMm(inches: number): number {
  return Math.round(inches * 25.4 * 1000) / 1000;
}
