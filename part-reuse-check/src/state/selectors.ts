// Derived values for components. Pure functions over AppState + the fixtures.

import type {
  AppState,
  AttributeKey,
  DuplicateCluster,
  Family,
  PartRecord,
  StepDefinition,
  VocabOption,
} from '../types';
import { filterCandidates, optionsForStep, poolCounts } from '../engine/candidates';
import { stepsFor } from '../engine/steps';
import { ALL_PARTS, CLUSTERS, VOCAB } from './context';

export function selectFamily(state: AppState): Family | null {
  const a = state.query.answers['family'];
  if (a?.state === 'answered') return a.value as Family;
  return null;
}

export function selectSteps(state: AppState): StepDefinition[] {
  return stepsFor(selectFamily(state));
}

export function selectCurrentStep(state: AppState): StepDefinition {
  const steps = selectSteps(state);
  return steps[Math.min(state.stepIndex, steps.length - 1)];
}

export function selectPoolCounts(state: AppState) {
  return poolCounts(ALL_PARTS, state.query);
}

export function selectOptionsForCurrentStep(state: AppState): VocabOption[] {
  const step = selectCurrentStep(state);
  if (step.kind !== 'enum' && step.kind !== 'numeric') return [];
  if (!(step.key in VOCAB)) {
    // family step: vocab holds canonical values from the data (all families)
    if (step.key === 'family') return VOCAB.family ?? [];
    return [];
  }
  return optionsForStep(ALL_PARTS, state.query, step.key as AttributeKey, VOCAB);
}

export function selectClustersForVisibleResults(state: AppState): DuplicateCluster[] {
  if (!state.results) return [];
  const gpns = new Set(state.results.map((r) => r.part.gpn));
  return CLUSTERS.filter((c) => c.gpns.some((g) => gpns.has(g)));
}

export function selectAllParts(): PartRecord[] {
  return ALL_PARTS;
}
export function selectAllClusters(): DuplicateCluster[] {
  return CLUSTERS;
}

export function selectPartByGpn(gpn: string): PartRecord | undefined {
  return ALL_PARTS.find((p) => p.gpn === gpn);
}

/** For FR-13: records that would survive scope but were disqualified by answers. */
export function selectExcluded(state: AppState) {
  if (!state.results) return [];
  return state.results.filter((r) => r.verdict === 'different');
}
