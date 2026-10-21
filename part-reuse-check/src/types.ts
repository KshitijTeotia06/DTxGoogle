// ============================================================================
// FROZEN CONTRACT — do not edit outside T1.
// Transcribed verbatim from ARCHITECTURE.md §4.
// ============================================================================

// ---------- domain ----------
export type Family =
  | 'screw'
  | 'bolt'
  | 'nut'
  | 'cage nut'
  | 'washer'
  | 'standoff';

export type LifecyclePhase =
  | 'Production'
  | 'Preliminary'
  | 'Planning'
  | 'Prototype'
  | 'End of Production'
  | 'Sunset'
  | 'Obsolete';

export type AttributeKey =
  | 'family'
  | 'threadSize' //      'M3' | '10-32' | '1/4-20'
  | 'threadPitchMm' //   number
  | 'lengthMm' //        number, normalised from in/mm
  | 'headType'
  | 'driveType'
  | 'driveSize' //       'T10' | 'PH2' — informational, never a filter
  | 'material'
  | 'materialGrade' //   '18-8' | '304' | '316' | 'A2' | 'A4' — informational
  | 'finish'
  | 'gradeClass' //      'grade 8' | 'class 8.8'
  | 'integralWasher' //  screws, bolts, nuts
  | 'fitsScrewSize' //   washers: threadSize ?? nominalScrewSize
  | 'washerStyle' //     washers
  | 'innerDiameterMm'
  | 'outerDiameterMm'
  | 'thicknessMm';

/** Null means the description does not state it. Never a default, never inferred (R1). */
export interface PartAttributes {
  family: Family;
  threadSize: string | null;
  threadPitchMm: number | null;
  lengthMm: number | null;
  headType: string | null;
  driveType: string | null;
  driveSize: string | null;
  material: string | null;
  materialGrade: string | null;
  finish: string | null;
  gradeClass: string | null;
  integralWasher: string | null;
  fitsScrewSize: string | null;
  washerStyle: string | null;
  innerDiameterMm: number | null;
  outerDiameterMm: number | null;
  thicknessMm: number | null;
}

/** The raw text each numeric attribute was read from, for display. Keyed by AttributeKey. */
export type RawValues = Partial<Record<AttributeKey, string>>;

export interface SourceRef {
  sheet: 'Set 01' | 'Set 02';
  row: number;
}

export interface ManufacturerRef {
  name: string;
  partNumber: string;
}

export interface PartRecord {
  /** As written in the sheet, leading zeros preserved. The only form shown in UI. */
  gpn: string;
  /** Leading zeros stripped. Join key only. */
  gpnKey: string;
  /** Verbatim, never cleaned up. */
  description: string;
  /** Verbatim part-type column value. */
  partType: string;
  phase: LifecyclePhase;
  sources: SourceRef[];
  manufacturers: ManufacturerRef[];
  attributes: PartAttributes;
  raw: RawValues;
  packaging: { quantity: number | null; isKit: boolean };
}

// ---------- query ----------
export type AnswerState = 'pending' | 'answered' | 'skipped';

export interface Answer {
  key: AttributeKey;
  state: AnswerState;
  /** null whenever state is not 'answered'. */
  value: string | number | null;
}

export interface Scope {
  phases: LifecyclePhase[];
  allowKits: boolean;
  /** false (default) = inclusive filtering per R2. true = exclude records with unknowns. */
  strict: boolean;
}

export interface Query {
  answers: Partial<Record<AttributeKey, Answer>>;
  scope: Scope;
}

// ---------- vocabulary ----------
export interface VocabOption {
  /** The canonical value stored in PartAttributes. */
  canonical: string;
  /** What the dropdown shows, units included: 'M3', '0.5 mm', 'pan head'. */
  label: string;
  /** Raw database spellings, for substring search (FR-4). */
  rawVariants: string[];
  /** Records in the whole fixture stating this value. Recomputed per pool at runtime. */
  count: number;
}

export type Vocabulary = Partial<Record<AttributeKey, VocabOption[]>>;

// ---------- matching ----------
export type AttributeVerdict = 'match' | 'unknown' | 'differs' | 'not-asked';
export type ResultVerdict = 'match' | 'review' | 'different';

export interface AttributeComparison {
  key: AttributeKey;
  asked: string | number | null;
  found: string | number | null;
  verdict: AttributeVerdict;
}

export interface MatchResult {
  part: PartRecord;
  verdict: ResultVerdict;
  comparisons: AttributeComparison[];
  unknownKeys: AttributeKey[];
  differingKeys: AttributeKey[];
  /** Populated only for 'different' records, for the excluded summary (FR-13). */
  exclusionReason: string | null;
}

// ---------- duplicates ----------
export type DuplicateEvidence = 'shared-mpn' | 'identical-description';

export interface DuplicateCluster {
  id: string;
  evidence: DuplicateEvidence;
  /** The shared MPN, or the normalised description. */
  evidenceValue: string;
  gpns: string[];
  /** Attributes on which two members have stated, differing values. */
  conflictingKeys: AttributeKey[];
}

// ---------- steps ----------
export interface StepDefinition {
  key: AttributeKey;
  /** Question shown to the engineer. */
  prompt: string;
  /** One line under the prompt explaining why it is asked. */
  help: string;
  kind: 'enum' | 'numeric';
  /** Appended to numeric option labels. */
  unit?: 'mm';
  /** When true, a stated difference makes a record 'different' (FR-11). */
  disqualifying: boolean;
}

// ---------- app state ----------
export type Screen = 'wizard' | 'results' | 'compare' | 'deadEnd' | 'flags';

export interface FlagEntry {
  clusterId: string;
  at: string;
  note: string;
}

export interface AppState {
  screen: Screen;
  stepIndex: number;
  query: Query;
  /** Set when a search has run; null while in the wizard. */
  results: MatchResult[] | null;
  /** GPNs chosen for comparison, max 2. */
  compareGpns: string[];
  flags: FlagEntry[];
}
