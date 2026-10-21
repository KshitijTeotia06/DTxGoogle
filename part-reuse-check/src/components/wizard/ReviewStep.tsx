import { useAppState, useDispatch } from '../../state/context';
import { selectSteps } from '../../state/selectors';

export function ReviewStep() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);
  const attributeSteps = steps.filter(
    (s) => s.key !== ('__scope__' as any) && s.key !== ('__review__' as any)
  );

  return (
    <section className="step">
      <header className="step-header">
        <div className="step-progress">
          Step {state.stepIndex + 1} of {steps.length}
        </div>
        <h2 className="step-prompt">Review your query</h2>
        <p className="step-help">
          Everything you have told us. Click any row to jump back and change it, or run the search.
        </p>
      </header>

      <ul className="review-list">
        {attributeSteps.map((s, i) => {
          const a = state.query.answers[s.key];
          const label =
            a?.state === 'answered'
              ? String(a.value) + (s.unit === 'mm' ? ' mm' : '')
              : a?.state === 'skipped'
              ? 'skipped'
              : 'not answered';
          const cls =
            a?.state === 'answered'
              ? 'is-answered'
              : a?.state === 'skipped'
              ? 'is-skipped'
              : 'is-pending';
          return (
            <li key={s.key as string} className={`review-row ${cls}`}>
              <button
                className="review-row-btn"
                onClick={() => dispatch({ type: 'GOTO_STEP', index: i })}
              >
                <span className="review-label">{s.prompt}</span>
                <span className="review-value">{label}</span>
                <span className="review-jump">change</span>
              </button>
            </li>
          );
        })}
        <li className="review-row is-answered">
          <button
            className="review-row-btn"
            onClick={() =>
              dispatch({ type: 'GOTO_STEP', index: steps.length - 2 })
            }
          >
            <span className="review-label">Scope</span>
            <span className="review-value">
              {state.query.scope.phases.join(', ')}
              {state.query.scope.allowKits ? ' · kits included' : ''}
              {state.query.scope.strict ? ' · strict mode' : ''}
            </span>
            <span className="review-jump">change</span>
          </button>
        </li>
      </ul>

      <footer className="step-footer">
        <div className="step-controls">
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'BACK' })}>
            ← Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'RUN_SEARCH' })}
          >
            Run search →
          </button>
        </div>
      </footer>
    </section>
  );
}
