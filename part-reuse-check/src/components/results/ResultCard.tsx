import type { MatchResult } from '../../types';
import { VerdictBadge } from '../common/VerdictBadge';
import { useAppState, useDispatch } from '../../state/context';
import { selectSteps } from '../../state/selectors';
import { labelFor } from '../../engine/match';

export function ResultCard({ result }: { result: MatchResult }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);
  const promptFor = (k: string) =>
    steps.find((s) => s.key === k)?.prompt ?? labelFor(k as any);

  const checked = state.compareGpns.includes(result.part.gpn);

  return (
    <article className="result-card">
      <header className="result-head">
        <div className="result-head-left">
          <label className="result-check">
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                dispatch({ type: 'TOGGLE_COMPARE', gpn: result.part.gpn })
              }
            />
            <span className="visually-hidden">Compare {result.part.gpn}</span>
          </label>
          <span className="result-gpn">{result.part.gpn}</span>
          <VerdictBadge verdict={result.verdict} />
        </div>
        <div className="result-head-right">
          <span className="result-phase">{result.part.phase}</span>
          <span className="result-mfr">
            {result.part.manufacturers.length} manufacturer
            {result.part.manufacturers.length === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      <blockquote className="result-desc">"{result.part.description}"</blockquote>

      {result.verdict === 'review' && result.unknownKeys.length > 0 ? (
        <p className="result-unknowns">
          Unknown here:{' '}
          {result.unknownKeys.map((k, i) => (
            <span key={k}>
              {i > 0 ? ', ' : ''}
              <span className="chip chip-unknown">{promptFor(k).replace(/\?$/, '')}</span>
            </span>
          ))}
        </p>
      ) : null}

      <footer className="result-foot">
        <span className="result-sources">
          {result.part.sources.map((s, i) => (
            <span key={i} className="src">{s.sheet} r{s.row}</span>
          ))}
        </span>
        {result.part.manufacturers.length > 0 ? (
          <span className="result-mpn">
            MPN:&nbsp;
            {result.part.manufacturers
              .map((m) => m.partNumber)
              .filter(Boolean)
              .slice(0, 3)
              .join(' · ')}
          </span>
        ) : null}
      </footer>
    </article>
  );
}
