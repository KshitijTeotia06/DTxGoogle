import { useAppState, useDispatch } from '../../state/context';
import { selectSteps } from '../../state/selectors';

export function ProgressRail() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);

  return (
    <aside className="progress-rail" aria-label="Steps">
      <h3 className="rail-title">Your query</h3>
      <ol className="rail-list">
        {steps.map((s, i) => {
          const a = state.query.answers[s.key];
          const isCurrent = i === state.stepIndex;
          let cls = 'rail-pending';
          let value = '';
          if (a?.state === 'answered') {
            cls = 'rail-answered';
            value = String(a.value) + (s.unit === 'mm' ? ' mm' : '');
          } else if (a?.state === 'skipped') {
            cls = 'rail-skipped';
            value = 'skipped';
          } else if (s.key === ('__scope__' as any)) {
            cls = 'rail-answered';
            value = `${state.query.scope.phases.length} phases`;
          } else if (s.key === ('__review__' as any)) {
            cls = i < state.stepIndex ? 'rail-answered' : 'rail-pending';
            value = '';
          }
          if (isCurrent) cls += ' is-current';
          const clickable = i <= state.stepIndex || cls.includes('answered') || cls.includes('skipped');
          return (
            <li key={String(s.key) + i} className={`rail-row ${cls}`}>
              <button
                className="rail-btn"
                disabled={!clickable}
                onClick={() => dispatch({ type: 'GOTO_STEP', index: i })}
              >
                <span className="rail-num">{i + 1}</span>
                <span className="rail-text">
                  <span className="rail-prompt">{s.prompt}</span>
                  {value ? <span className="rail-value">{value}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
