// Offline ETL. Run with `npm run build:fixture`.
// Reads data/set01.csv + data/set02.csv, merges by normalised GPN, filters to
// fastener part types, runs extraction, writes parts.json / vocab.json /
// clusters.json into src/fixtures/, then prints a summary table (ARCHITECTURE §6).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  LifecyclePhase,
  ManufacturerRef,
  PartRecord,
  SourceRef,
} from '../src/types';
import { extractAttributes } from './lib/extract';
import { buildVocabulary } from './lib/vocab';
import { buildClusters } from './lib/clusters';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ---- CSV parsing (RFC 4180-ish; handles quoted fields with embedded commas, "" escapes, CRLF) ----
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (ch === '\r') {
        // swallow; '\n' will finish the row
      } else {
        field += ch;
      }
    }
  }
  // last field / row
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c && c.length));
}

function headerIndex(headers: string[], target: string): number {
  return headers.findIndex((h) => h.trim().toLowerCase() === target.toLowerCase());
}

function stripLeadingZeros(gpn: string): string {
  return gpn.replace(/^0+/, '') || gpn;
}

function normalisePhase(raw: string): LifecyclePhase {
  const s = (raw || '').trim();
  const known: LifecyclePhase[] = [
    'Production',
    'Preliminary',
    'Planning',
    'Prototype',
    'End of Production',
    'Sunset',
    'Obsolete',
  ];
  const hit = known.find((p) => p.toLowerCase() === s.toLowerCase());
  return hit ?? 'Production';
}

// A fastener part type matches one of these substrings on the Set 02 part-type
// column, or any value from Set 01 (Set 01 is a curated fastener-only list).
const FASTENER_TOKENS = ['bolts & screws', 'nut', 'washer'];

function isFastenerPartType(pt: string): boolean {
  const s = (pt || '').toLowerCase();
  return FASTENER_TOKENS.some((t) => s.includes(t));
}

// ---- read inputs ----------------------------------------------------------
const set01Path = resolve(ROOT, 'data/set01.csv');
const set02Path = resolve(ROOT, 'data/set02.csv');

const set01Rows = parseCsv(readFileSync(set01Path, 'utf8'));
const set02Rows = parseCsv(readFileSync(set02Path, 'utf8'));

const h1 = set01Rows[0];
const h2 = set02Rows[0];

const g1 = headerIndex(h1, 'GPN');
const d1 = headerIndex(h1, 'Description');
const s1 = headerIndex(h1, 'Status');
const t1 = headerIndex(h1, 'Type of Fastener');

const g2 = headerIndex(h2, 'Number');
const pt2 = headerIndex(h2, 'Part Type');
const d2 = headerIndex(h2, 'Description');
const ph2 = headerIndex(h2, 'Lifecycle Phase');
const mn2 = headerIndex(h2, 'Mfr. Name (Manufacturers)');
const mp2 = headerIndex(h2, 'Mfr. Part Number (Manufacturers)');

type Merged = {
  gpnDisplay: string;      // first-seen with leading zeros intact
  gpnKey: string;
  description: string;
  partType: string;
  phase: LifecyclePhase;
  sources: SourceRef[];
  manufacturers: ManufacturerRef[];
};

const merged = new Map<string, Merged>();

function getOrCreate(gpn: string): Merged {
  const key = stripLeadingZeros(gpn.trim());
  let m = merged.get(key);
  if (!m) {
    m = {
      gpnDisplay: gpn.trim(),
      gpnKey: key,
      description: '',
      partType: '',
      phase: 'Production',
      sources: [],
      manufacturers: [],
    };
    merged.set(key, m);
  }
  return m;
}

// Set 01
for (let i = 1; i < set01Rows.length; i++) {
  const r = set01Rows[i];
  const gpn = (r[g1] ?? '').trim();
  if (!gpn) continue;
  const m = getOrCreate(gpn);
  if (!m.description && r[d1]) m.description = r[d1];
  if (!m.partType && r[t1]) m.partType = r[t1];
  if (r[s1]) m.phase = normalisePhase(r[s1]);
  m.sources.push({ sheet: 'Set 01', row: i + 1 });
}

// Set 02
for (let i = 1; i < set02Rows.length; i++) {
  const r = set02Rows[i];
  const gpn = (r[g2] ?? '').trim();
  if (!gpn) continue;
  const m = getOrCreate(gpn);
  if (!m.description && r[d2]) m.description = r[d2];
  if (!m.partType && r[pt2]) m.partType = r[pt2];
  if (r[ph2]) m.phase = normalisePhase(r[ph2]);
  m.sources.push({ sheet: 'Set 02', row: i + 1 });
  const name = (r[mn2] ?? '').trim();
  const part = (r[mp2] ?? '').trim();
  if (name || part) m.manufacturers.push({ name, partNumber: part });
}

// ---- build allParts (whole snapshot) and parts (fasteners) ---------------
const allParts: PartRecord[] = [];
for (const m of merged.values()) {
  const { attributes, raw } = extractAttributes(m.partType, m.description);
  // packaging via extract (needs separate call)
  // Note: extractAttributes already extracted material/etc; packaging is a tiny inline.
  const isKit = /\bkit\b/i.test(m.description);
  const qtyMatch =
    m.description.match(/\((\d+)\s*(?:pieces|pcs|pack|count)\b/i) ||
    m.description.match(/\b(\d+)\s*(?:PACK|PK|PCS|COUNT|PIECES)\b/i);
  allParts.push({
    gpn: m.gpnDisplay,
    gpnKey: m.gpnKey,
    description: m.description,
    partType: m.partType,
    phase: m.phase,
    sources: m.sources,
    manufacturers: m.manufacturers,
    attributes,
    raw,
    packaging: { quantity: qtyMatch ? Number(qtyMatch[1]) : null, isKit },
  });
}

const parts = allParts
  .filter((p) => isFastenerPartType(p.partType))
  .sort((a, b) => a.gpn.localeCompare(b.gpn));

// ---- vocab + clusters -----------------------------------------------------
const vocab = buildVocabulary(parts);
const clusters = buildClusters(parts, allParts);

// ---- write ---------------------------------------------------------------
const outDir = resolve(ROOT, 'src/fixtures');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'parts.json'), JSON.stringify(parts, null, 2));
writeFileSync(resolve(outDir, 'vocab.json'), JSON.stringify(vocab, null, 2));
writeFileSync(
  resolve(outDir, 'clusters.json'),
  JSON.stringify(clusters, null, 2)
);

// ---- summary -------------------------------------------------------------
const countBy = <K extends string>(xs: PartRecord[], f: (p: PartRecord) => K) => {
  const m = new Map<K, number>();
  for (const x of xs) {
    const k = f(x);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
};

const families = countBy(parts, (p) => p.attributes.family);
const phases = countBy(parts, (p) => p.phase);
const kits = parts.filter((p) => p.packaging.isKit).length;
const mpnClusters = clusters.filter((c) => c.evidence === 'shared-mpn');
const descClusters = clusters.filter((c) => c.evidence === 'identical-description');
const mpnGpns = new Set(mpnClusters.flatMap((c) => c.gpns)).size;
const descGpns = new Set(descClusters.flatMap((c) => c.gpns)).size;

const coverage = (key: keyof PartRecord['attributes']) => {
  const n = parts.filter((p) => (p.attributes as any)[key] !== null).length;
  return `${((n / parts.length) * 100).toFixed(1)}%`;
};

console.log('');
console.log(`distinct GPNs                ${allParts.length}`);
console.log(`in scope                     ${parts.length}`);
for (const [f, n] of [...families.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${f.padEnd(27)}${n}`);
}
console.log('');
for (const phase of [
  'Production',
  'Preliminary',
  'Planning',
  'Prototype',
  'End of Production',
  'Sunset',
  'Obsolete',
] as LifecyclePhase[]) {
  console.log(`${phase.padEnd(29)}${phases.get(phase) ?? 0}`);
}
console.log('');
console.log(`kits                         ${kits}`);
console.log(`shared-MPN clusters          ${mpnClusters.length}  (${mpnGpns} GPNs)`);
console.log(`identical-desc clusters      ${descClusters.length}  (${descGpns} GPNs)`);
console.log('');
console.log('attribute coverage (% of in-scope records stating a value)');
for (const k of [
  'threadSize',
  'threadPitchMm',
  'lengthMm',
  'headType',
  'driveType',
  'material',
  'finish',
  'integralWasher',
  'fitsScrewSize',
  'innerDiameterMm',
  'outerDiameterMm',
  'thicknessMm',
] as const) {
  console.log(`  ${k.padEnd(27)}${coverage(k)}`);
}
console.log('');
console.log(`wrote ${parts.length} parts, ${Object.keys(vocab).length} vocab keys, ${clusters.length} clusters`);
console.log(`       -> src/fixtures/{parts,vocab,clusters}.json`);
