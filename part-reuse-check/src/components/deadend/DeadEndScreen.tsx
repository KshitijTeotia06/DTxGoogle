import { useAppState, useDispatch } from '../../state/context';
import { selectSteps } from '../../state/selectors';
import { NewGpnRequest } from './NewGpnRequest';

export function DeadEndScreen() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);
  const attributes = steps.filter(
    (s) => s.key !== ('__scope__' as any) && s.key !== ('__review__' as any)
  );
  const answered = attributes.filter(
    (s) => state.query.answers[s.key]?.state === 'answered'
  );

  const nearMisses = (state.results ?? []).filter((r) => r.verdict === 'different').slice(0, 10);

  return (
    <div className="dead-end">
      <header className="dead-head">
        <h2>No existing part matched.</h2>
        <p>
          No record was good enough to merit review. Here is what you asked for and the nearest misses.
        </p>
      </header>

      <section className="dead-search">
        <h3>You searched for</h3>
        <ul>
          {answered.map((s) => {
            const a = state.query.answers[s.key]!;
            return (
              <li key={s.key as string}>
                <span className="dead-k">{s.prompt.replace(/\?$/, '')}:</span>{' '}
                <span className="dead-v">
                  {String(a.value) + (s.unit === 'mm' ? ' mm' : '')}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="dead-misses">
        <h3>Nearest misses</h3>
        {nearMisses.length === 0 ? (
          <p>No candidates were close. The search even looked past the attributes you skipped.</p>
        ) : (
          <ul>
            {nearMisses.map((r) => (
              <li key={r.part.gpn}>
                <strong>{r.part.gpn}</strong> — {r.exclusionReason}
                <br />
                <span className="dead-desc">"{r.part.description}"</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NewGpnRequest />

      <footer className="dead-foot">
        <button
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' })}
        >
          ← Change query
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'RESET' })}>
          Start over
        </button>
      </footer>
    </div>
  );
}
