import { useMemo } from 'react';
import { useAppState, useDispatch } from '../../state/context';
import {
  selectClustersForVisibleResults,
  selectExcluded,
  selectSteps,
} from '../../state/selectors';
import { ExcludedSummary } from './ExcludedSummary';
import { QueryRecap } from './QueryRecap';
import { ResultsLegend } from './ResultsLegend';
import { ResultsTable } from './ResultsTable';

export function ResultsScreen() {
  const state = useAppState();
  const dispatch = useDispatch();
  const all = state.results ?? [];
  const visible = all.filter((r) => r.verdict === 'match' || r.verdict === 'review');
  const excluded = selectExcluded(state);

  const clusters = selectClustersForVisibleResults(state);
  const clustersByGpn = useMemo(() => {
    const m = new Map<string, typeof clusters>();
    for (const c of clusters) {
      for (const g of c.gpns) {
        if (!m.has(g)) m.set(g, []);
        m.get(g)!.push(c);
      }
    }
    return m;
  }, [clusters]);

  // Columns: every attribute step the engineer answered OR skipped (not pending),
  // excluding the family question (that's already in context). If nothing has
  // been answered yet, fall back to showing every step for the family so the
  // table is still useful.
  const steps = selectSteps(state).filter(
    (s) =>
      s.key !== ('__scope__' as any) &&
      s.key !== ('__review__' as any) &&
      s.key !== 'family'
  );
  const touched = steps.filter((s) => !!state.query.answers[s.key]);
  const columns = touched.length ? touched : steps;

  return (
    <div className="results">
      <QueryRecap />

      <div className="results-toolbar">
        <ResultsLegend />
        <div className="toolbar-right">
          <button
            className="btn btn-primary btn-sm"
            disabled={state.compareGpns.length !== 2}
            onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'compare' })}
            title={
              state.compareGpns.length !== 2
                ? 'Tick exactly two GPNs to compare them side by side'
                : 'Compare the two selected GPNs'
            }
          >
            Compare selected ({state.compareGpns.length}/2)
          </button>
          {state.flags.length > 0 ? (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'flags' })}
            >
              Flag log ({state.flags.length})
            </button>
          ) : null}
        </div>
      </div>

      <ResultsTable
        rows={visible}
        columns={columns}
        clustersByGpn={clustersByGpn}
      />

      <ExcludedSummary excluded={excluded} />
    </div>
  );
}
