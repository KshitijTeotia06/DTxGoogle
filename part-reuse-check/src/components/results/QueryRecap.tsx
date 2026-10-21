import { useAppState, useDispatch } from '../../state/context';
import { selectSteps } from '../../state/selectors';

export function QueryRecap() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state).filter(
    (s) => s.key !== ('__scope__' as any) && s.key !== ('__review__' as any)
  );
  const scope = state.query.scope;

  const answered = steps.filter(
    (s) => state.query.answers[s.key]?.state === 'answered'
  );
  const skipped = steps.filter(
    (s) => state.query.answers[s.key]?.state === 'skipped'
  );

  const results = state.results ?? [];
  const nMatch = results.filter((r) => r.verdict === 'match').length;
  const nReview = results.filter((r) => r.verdict === 'review').length;
  const nDiff = results.filter((r) => r.verdict === 'different').length;

  return (
    <section className="query-recap" aria-label="Your search">
      <div className="recap-head">
        <div>
          <h3>Your search</h3>
          <p className="recap-sub">
            {answered.length} attribute{answered.length === 1 ? '' : 's'} answered
            {skipped.length ? `, ${skipped.length} skipped` : ''}. Verdicts
            update whenever you change the query.
          </p>
        </div>
        <div className="recap-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' })}
          >
            ← Edit query
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => dispatch({ type: 'RESET' })}
          >
            New search
          </button>
        </div>
      </div>

      <div className="recap-chips">
        {answered.map((s) => {
          const a = state.query.answers[s.key]!;
          return (
            <button
              key={s.key as string}
              className="recap-chip recap-chip-answered"
              title="Click to change"
              onClick={() => {
                dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' });
                const idx = selectSteps(state).findIndex((x) => x.key === s.key);
                if (idx >= 0) dispatch({ type: 'GOTO_STEP', index: idx });
              }}
            >
              <span className="recap-chip-k">
                {s.prompt.replace(/\?$/, '')}
              </span>
              <span className="recap-chip-v">
                {String(a.value)}
                {s.unit === 'mm' ? ' mm' : ''}
              </span>
            </button>
          );
        })}
        {skipped.map((s) => (
          <button
            key={s.key as string}
            className="recap-chip recap-chip-skipped"
            title="Click to answer"
            onClick={() => {
              dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' });
              const idx = selectSteps(state).findIndex((x) => x.key === s.key);
              if (idx >= 0) dispatch({ type: 'GOTO_STEP', index: idx });
            }}
          >
            <span className="recap-chip-k">
              {s.prompt.replace(/\?$/, '')}
            </span>
            <span className="recap-chip-v">skipped</span>
          </button>
        ))}
        <span className="recap-chip recap-chip-scope">
          <span className="recap-chip-k">scope</span>
          <span className="recap-chip-v">
            {scope.phases.join(', ')}
            {scope.allowKits ? ' · kits' : ''}
            {scope.strict ? ' · strict' : ''}
          </span>
        </span>
      </div>

      <div className="recap-counts">
        <span className="count-pill count-match">
          <strong>{nMatch}</strong>&nbsp;match
        </span>
        <span className="count-pill count-review">
          <strong>{nReview}</strong>&nbsp;needs review
        </span>
        <span className="count-pill count-different">
          <strong>{nDiff}</strong>&nbsp;excluded
        </span>
      </div>
    </section>
  );
}
