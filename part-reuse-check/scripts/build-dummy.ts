// Build a CLEAN hand-crafted dummy fixture. Writes the same three JSON files
// as build-fixture.ts, but from a small set of readable records so the UI
// looks the way it should during a demo.
//
// Run with:  npm run build:fixture

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  LifecyclePhase,
  ManufacturerRef,
  PartRecord,
} from '../src/types';
import { extractAttributes } from './lib/extract';
import { buildVocabulary } from './lib/vocab';
import { buildClusters } from './lib/clusters';

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(__filename), '..');

interface Seed {
  gpn: string;
  description: string;
  partType: string;
  phase: LifecyclePhase;
  manufacturers?: ManufacturerRef[];
}

// -------- the dummy records -----------------------------------------------
// Every description is deliberately verbose so the extractor pulls out every
// attribute cleanly. Phrases like "M3x0.5mm Thread", "8mm Long", "Pan Head",
// "Phillips", "Zinc Plated Steel" are what the normaliser is designed for.

const SEEDS: Seed[] = [
  // ========================================================================
  //  M3 pan phillips steel zinc plated 8mm — the hero demo cluster
  // ========================================================================
  {
    gpn: '07052664',
    description:
      'Screw, M3x0.5mm Thread, Pan Head, Phillips, Zinc-Plated Steel, 8mm Long',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [
      { name: 'McMaster-Carr', partNumber: '91290A113' },
      { name: 'Fastenal', partNumber: 'M30500800PP' },
    ],
  },

  // Same part, worse description. Pitch, material and finish all unstated →
  // "needs review" in the happy path demo, picks up extra `review`s on skip.
  {
    gpn: '07022596',
    description:
      'Screw, M3x8mm, Pan Philips Head, With External-Tooth Lock Washer',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN82428' }],
  },

  // Identical-description duplicate cluster — 1106617 / 1249277 / 1094168.
  // All three carry the exact same text, so the fixture clusters them by
  // identical-description evidence.
  {
    gpn: '1106617',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-M3-8-PP' }],
  },
  {
    gpn: '1249277',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Prototype',
    manufacturers: [{ name: 'Würth', partNumber: 'WU-304-M3-8' }],
  },
  {
    gpn: '1094168',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Preliminary',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-M30508PP' }],
  },

  // Shared-MPN cluster around 0100-1-002-01 — four GPNs, four different
  // vendors, descriptions that look unrelated.
  {
    gpn: '07016397',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Supermicro', partNumber: '0100-1-002-01' }],
  },
  {
    gpn: '07035144',
    description:
      'HDW, SCREW PANHEAD PHILLIPS M3 x 8MM, STEEL, ZINC',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Dell', partNumber: '0100-1-002-01' }],
  },
  {
    gpn: '07090971',
    description:
      'Screw, PHP, M3 x 0.5 x 8 mm, Steel, Zinc, Rack Mount Hardware',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Preliminary',
    manufacturers: [{ name: 'HPE', partNumber: '0100-1-002-01' }],
  },
  {
    gpn: '1017592-01',
    description:
      'Mounting Screw, M3 Pan Head Philips, 8mm, Zinc Steel, RoHS',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Lenovo', partNumber: '0100-1-002-01' }],
  },

  // Conflict cluster — shared MPN 90317A111, members disagree on material.
  {
    gpn: '07070024',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Steel, Zinc',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '90317A111' }],
  },
  {
    gpn: '07082586',
    description:
      'Screw, M3x0.5mm Thread, 8mm Long, Pan Head, Phillips, Stainless Steel, Zinc Plated, 316',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '90317A111' }],
  },

  // ========================================================================
  //  Other M3 variants — give the dropdowns real counts & variety
  // ========================================================================
  {
    gpn: '12345001',
    description:
      'Screw, M3x0.5mm Thread, 6mm Long, Flat Head, Phillips, Stainless Steel, Passivated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN82600' }],
  },
  {
    gpn: '12345002',
    description:
      'Screw, M3x0.5mm Thread, 12mm Long, Button Head, Torx T10, Alloy Steel, Black Oxide',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '92949A116' }],
  },
  {
    gpn: '12345003',
    description:
      'Screw, M3x0.5mm Thread, 10mm Long, Socket Head, Hex, Stainless Steel 18-8, Plain',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '92196A113' }],
  },
  {
    gpn: '12345004',
    description:
      'Screw, M3x0.5mm Thread, 20mm Long, Pan Head, Phillips, Steel, Zinc Plated, Split Lock Washer',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Prototype',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-M3-20-PPZ' }],
  },
  {
    gpn: '12345005',
    description:
      'Screw, Captive, Pan Head Phillips, M3x0.5mm Thread, 6mm Long, Steel, Zinc Plated, W/Washer',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'PEM', partNumber: 'PFS2-M3-6-ZI' }],
  },

  // ========================================================================
  //  Different threads: M4, M5, imperial
  // ========================================================================
  {
    gpn: '12345010',
    description:
      'Screw, M4x0.7mm Thread, 10mm Long, Socket Head, Hex, Alloy Steel, Black Oxide',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '91290A194' }],
  },
  {
    gpn: '12345011',
    description:
      'Screw, M5x0.8mm Thread, 16mm Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN82600-M5-16' }],
  },
  {
    gpn: '12345012',
    description:
      'Screw, M5x0.8mm Thread, 25mm Long, Hex Head, Hex, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Preliminary',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-M50825HH' }],
  },
  {
    gpn: '07001144',
    description:
      'Screw, 10-32 Thread, 1/2in Long, Pan Head, Phillips, Steel, Black Oxide',
    partType: 'Fastener-Bolts & Screws',
    phase: 'End of Production',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-10-32-050-BLK' }],
  },
  {
    gpn: '07004435',
    description:
      'Screw, 8-32 Thread, 3/8in Long, Pan Head, Phillips, Steel, Zinc Plated',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-832038PP' }],
  },

  // ========================================================================
  //  Bolts
  // ========================================================================
  {
    gpn: '13000001',
    description:
      'Bolt, Hex Head, M8x1.25mm Thread, 25mm Long, Steel, Zinc Plated, Grade 8.8',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'Würth', partNumber: 'WU-M8-25-G88' }],
  },
  {
    gpn: '13000002',
    description:
      'Bolt, Hex Head, M10x1.5mm Thread, 40mm Long, Stainless Steel, Plain',
    partType: 'Fastener-Bolts & Screws',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '92240A630' }],
  },

  // ========================================================================
  //  Nuts and cage nuts
  // ========================================================================
  {
    gpn: '14000001',
    description: 'Nut, Hex, M3x0.5mm Thread, Steel, Zinc Plated',
    partType: 'Fastener-Nut',
    phase: 'Production',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-HN-M3-ZI' }],
  },
  {
    gpn: '14000002',
    description:
      'Nut, Hex, M5x0.8mm Thread, Stainless Steel 316, Passivated',
    partType: 'Fastener-Nut',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '91828A251' }],
  },
  {
    gpn: '07015054',
    description: 'Cage Nut, M6x1.0mm Thread, Steel, Zinc Plated (100 pieces)',
    partType: 'Fastener-Nut',
    phase: 'Production',
    manufacturers: [{ name: 'Hoffman', partNumber: 'HM-CN-M6-100' }],
  },
  {
    gpn: '14000003',
    description: 'Cage Nut, M5x0.8mm Thread, Steel, Zinc Plated',
    partType: 'Fastener-Nut',
    phase: 'Production',
    manufacturers: [{ name: 'Hoffman', partNumber: 'HM-CN-M5' }],
  },

  // ========================================================================
  //  Washers — give the washer wizard real variety
  // ========================================================================
  {
    gpn: '15000001',
    description:
      'Washer, M3, 3.2mm ID, 7mm OD, 0.5mm THK, Flat, Stainless Steel, Passivated',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '91116A110' }],
  },
  {
    gpn: '15000002',
    description:
      'Washer, M3, Split Lock, Steel, Zinc Plated',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-SLW-M3-ZI' }],
  },
  {
    gpn: '15000003',
    description:
      'Washer, M4, 4.3mm ID, 9mm OD, 0.8mm THK, External Tooth, Stainless Steel',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN14-M4' }],
  },
  {
    gpn: '15000004',
    description:
      'Washer, M5, 5.5mm ID, 10mm OD, 1mm THK, Flat, Steel, Zinc Plated',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-FW-M5-ZI' }],
  },
  {
    gpn: '04100607',
    description:
      'Washer, External Tooth, #10, Steel, Zinc Plated',
    partType: 'Fastener-Washers',
    phase: 'Production',
    manufacturers: [{ name: 'McMaster-Carr', partNumber: '91114A011' }],
  },
  {
    gpn: '15000005',
    description:
      'Washer, Flat, 1/4in Screw Size, 0.281in ID, 0.625in OD, Steel, Zinc Plated',
    partType: 'Fastener-Washers',
    phase: 'End of Production',
    manufacturers: [{ name: 'Fastenal', partNumber: 'FA-FW-14-ZI' }],
  },
  // Identical-description washer duplicate (two GPNs)
  {
    gpn: '15000010',
    description:
      'Washer, M3, 3.2mm ID, 7mm OD, 0.5mm THK, Flat, Stainless Steel, Passivated',
    partType: 'Fastener-Washers',
    phase: 'Prototype',
    manufacturers: [{ name: 'Bossard', partNumber: 'BN730-M3' }],
  },

  // ========================================================================
  //  Standoff
  // ========================================================================
  {
    gpn: '16000001',
    description:
      'Standoff, M3x0.5mm Thread, 10mm Long, Brass, Nickel Plated',
    partType: 'Fastener-Standoff',
    phase: 'Production',
    manufacturers: [{ name: 'Keystone', partNumber: 'KS-SO-M3-10-NI' }],
  },
];

// ---- turn seeds into PartRecords -----------------------------------------
const allParts: PartRecord[] = SEEDS.map((seed, i) => {
  const { attributes, raw } = extractAttributes(seed.partType, seed.description);
  const isKit = /\bkit\b/i.test(seed.description);
  const qty = seed.description.match(/\((\d+)\s*(?:pieces|pcs|pack|count)\b/i);
  return {
    gpn: seed.gpn,
    gpnKey: seed.gpn.replace(/^0+/, '') || seed.gpn,
    description: seed.description,
    partType: seed.partType,
    phase: seed.phase,
    sources: [{ sheet: 'Set 02', row: i + 2 }],
    manufacturers: seed.manufacturers ?? [],
    attributes,
    raw,
    packaging: { quantity: qty ? Number(qty[1]) : null, isKit },
  };
});

const parts = allParts
  .slice()
  .sort((a, b) => a.gpn.localeCompare(b.gpn));

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
const byFamily = new Map<string, number>();
for (const p of parts) {
  byFamily.set(p.attributes.family, (byFamily.get(p.attributes.family) ?? 0) + 1);
}

console.log('');
console.log(`DUMMY fixture built`);
console.log(`records       : ${parts.length}`);
for (const [f, n] of [...byFamily.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${f.padEnd(14)}${n}`);
}
console.log(`vocab keys    : ${Object.keys(vocab).length}`);
console.log(`clusters      : ${clusters.length}`);
console.log(`  shared-mpn            : ${clusters.filter((c) => c.evidence === 'shared-mpn').length}`);
console.log(`  identical-description : ${clusters.filter((c) => c.evidence === 'identical-description').length}`);
console.log('wrote src/fixtures/{parts,vocab,clusters}.json');
console.log('');
