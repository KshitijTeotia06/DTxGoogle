import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import type {
  AppState,
  DuplicateCluster,
  MatchResult,
  PartRecord,
  Vocabulary,
} from '../types';
import { reducer, initialState, Action } from './reducer';
import { filterCandidates } from '../engine/candidates';
import { matchAll } from '../engine/match';
import { rankResults } from '../engine/rank';
import { stepsFor } from '../engine/steps';

// Load the generated fixtures once at module load (NFR-2: no runtime file reads).
import partsJson from '../fixtures/parts.json';
import vocabJson from '../fixtures/vocab.json';
import clustersJson from '../fixtures/clusters.json';

export const ALL_PARTS: PartRecord[] = partsJson as unknown as PartRecord[];
export const VOCAB: Vocabulary = vocabJson as Vocabulary;
export const CLUSTERS: DuplicateCluster[] = clustersJson as unknown as DuplicateCluster[];

interface Ctx {
  state: AppState;
  dispatch: Dispatch<Action>;
  runSearch: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatchRaw] = useReducer(reducer, initialState);

  const [results, setResults] = React.useState<MatchResult[] | null>(null);
  const [screen, setScreen] = React.useState<AppState['screen']>('wizard');

  const runSearch = useCallback(() => {
    const family =
      state.query.answers['family']?.state === 'answered'
        ? (state.query.answers['family']!.value as any)
        : null;
    const steps = stepsFor(family);
    const pool = filterCandidates(ALL_PARTS, state.query);
    const matched = matchAll(pool, state.query, steps);
    // Inclusive filter already pruned real conflicts; keep only match/review in main list,
    // but hold onto `different` records for the ExcludedSummary via an additional pass.
    // To keep ExcludedSummary useful we also run match over the whole scope-filtered pool
    // and keep anything flagged `different`.
    const scopeOnly = filterCandidates(ALL_PARTS, {
      ...state.query,
      answers: {
        family: state.query.answers['family'],
      },
    });
    const scopeMatched = matchAll(scopeOnly, state.query, steps);
    const differents = scopeMatched.filter((r) => r.verdict === 'different');
    const combined = [...matched, ...differents.filter(
      (r) => !matched.some((m) => m.part.gpn === r.part.gpn)
    )];
    const ranked = rankResults(combined);
    setResults(ranked);
    const anyGood = ranked.some((r) => r.verdict === 'match' || r.verdict === 'review');
    setScreen(anyGood ? 'results' : 'deadEnd');
  }, [state.query]);

  // custom dispatch wraps RUN_SEARCH / OPEN_SCREEN side effects
  const dispatch: Dispatch<Action> = useCallback(
    (action: Action) => {
      if (action.type === 'RUN_SEARCH') {
        runSearch();
        return;
      }
      if (action.type === 'OPEN_SCREEN') {
        setScreen(action.screen);
        dispatchRaw(action);
        return;
      }
      if (action.type === 'RESET') {
        setResults(null);
        setScreen('wizard');
      }
      dispatchRaw(action);
    },
    [runSearch]
  );

  const combinedState: AppState = useMemo(
    () => ({ ...state, results, screen }),
    [state, results, screen]
  );

  const value = useMemo(() => ({ state: combinedState, dispatch, runSearch }), [combinedState, dispatch, runSearch]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useAppState(): AppState {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppProvider missing');
  return c.state;
}
export function useDispatch(): Dispatch<Action> {
  const c = useContext(AppCtx);
  if (!c) throw new Error('AppProvider missing');
  return c.dispatch;
}
