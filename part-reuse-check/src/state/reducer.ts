// App reducer. ARCHITECTURE §4 + §5.

import type {
  Answer,
  AppState,
  AttributeKey,
  Family,
  FlagEntry,
  Scope,
  Screen,
} from '../types';
import { stepsFor } from '../engine/steps';

export type Action =
  | { type: 'ANSWER'; key: AttributeKey; value: string | number }
  | { type: 'SKIP'; key: AttributeKey }
  | { type: 'BACK' }
  | { type: 'GOTO_STEP'; index: number }
  | { type: 'SET_SCOPE'; scope: Partial<Scope> }
  | { type: 'RUN_SEARCH' }
  | { type: 'TOGGLE_COMPARE'; gpn: string }
  | { type: 'OPEN_SCREEN'; screen: Screen }
  | { type: 'FLAG_CLUSTER'; clusterId: string }
  | { type: 'RESET' };

export const DEFAULT_SCOPE: Scope = {
  phases: ['Production', 'Preliminary', 'Planning'],
  allowKits: false,
  strict: false,
};

export const initialState: AppState = {
  screen: 'wizard',
  stepIndex: 0,
  query: { answers: {}, scope: DEFAULT_SCOPE },
  results: null,
  compareGpns: [],
  flags: [],
};

function familyOf(state: AppState): Family | null {
  const a = state.query.answers['family'];
  if (a?.state === 'answered' && typeof a.value === 'string') return a.value as Family;
  return null;
}

function withAnswer(
  state: AppState,
  key: AttributeKey,
  answer: Answer
): AppState {
  const answers = { ...state.query.answers, [key]: answer };
  // ANSWER on family resets every later answer to pending.
  if (key === 'family') {
    const keep: AppState['query']['answers'] = { family: answer };
    return {
      ...state,
      query: { ...state.query, answers: keep },
      results: null,
    };
  }
  return { ...state, query: { ...state.query, answers }, results: null };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ANSWER': {
      const next = withAnswer(state, action.key, {
        key: action.key,
        state: 'answered',
        value: action.value,
      });
      const steps = stepsFor(familyOf(next));
      return { ...next, stepIndex: Math.min(state.stepIndex + 1, steps.length - 1) };
    }
    case 'SKIP': {
      const next = withAnswer(state, action.key, {
        key: action.key,
        state: 'skipped',
        value: null,
      });
      const steps = stepsFor(familyOf(next));
      return { ...next, stepIndex: Math.min(state.stepIndex + 1, steps.length - 1) };
    }
    case 'BACK': {
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1) };
    }
    case 'GOTO_STEP': {
      const steps = stepsFor(familyOf(state));
      const i = Math.max(0, Math.min(action.index, steps.length - 1));
      return { ...state, stepIndex: i };
    }
    case 'SET_SCOPE': {
      return {
        ...state,
        query: { ...state.query, scope: { ...state.query.scope, ...action.scope } },
        results: null,
      };
    }
    case 'RUN_SEARCH': {
      // results computation lives in selectors; here we just flip the screen.
      // the Provider computes and stores results when this action fires.
      return state;
    }
    case 'TOGGLE_COMPARE': {
      const list = state.compareGpns.includes(action.gpn)
        ? state.compareGpns.filter((g) => g !== action.gpn)
        : [...state.compareGpns, action.gpn];
      return { ...state, compareGpns: list.slice(-2) };
    }
    case 'OPEN_SCREEN': {
      return { ...state, screen: action.screen };
    }
    case 'FLAG_CLUSTER': {
      if (state.flags.some((f) => f.clusterId === action.clusterId)) return state;
      const entry: FlagEntry = {
        clusterId: action.clusterId,
        at: new Date().toISOString(),
        note: 'Flagged from Results',
      };
      return { ...state, flags: [...state.flags, entry] };
    }
    case 'RESET': {
      return { ...initialState };
    }
    default:
      return state;
  }
}
