import { useAppState, useDispatch } from '../../state/context';
import { selectPartByGpn, selectSteps } from '../../state/selectors';
import { CompareRow } from './CompareRow';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';

export function CompareScreen() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [gpnA, gpnB] = state.compareGpns;
  const a = gpnA ? selectPartByGpn(gpnA) : undefined;
  const b = gpnB ? selectPartByGpn(gpnB) : undefined;
  const steps = selectSteps(state).filter(
    (s) => s.key !== SCOPE_STEP_KEY && s.key !== REVIEW_STEP_KEY && s.key !== 'family'
  );

  if (!a || !b) {
    return (
      <div className="compare">
        <p>
          Compare needs two records selected on the Results screen.{' '}
          <button
            className="btn btn-ghost"
            onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'results' })}
          >
            Back to results
          </button>
        </p>
      </div>
    );
  }

  const unknownsA = steps.filter(
    (s) => (a.attributes as any)[s.key] === null
  ).length;
  const unknownsB = steps.filter(
    (s) => (b.attributes as any)[s.key] === null
  ).length;

  return (
    <div className="compare">
      <header className="compare-head">
        <h2>Compare</h2>
        <button
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'results' })}
        >
          ← Back to results
        </button>
      </header>

      <table className="compare-table">
        <thead>
          <tr>
            <th scope="col">Attribute</th>
            <th scope="col">You asked</th>
            <th scope="col">{a.gpn}</th>
            <th scope="col">{b.gpn}</th>
          </tr>
          <tr className="compare-sub">
            <th />
            <th />
            <th className="desc">"{a.description}"</th>
            <th className="desc">"{b.description}"</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((s) => (
            <CompareRow
              key={s.key as string}
              step={s}
              answer={state.query.answers[s.key]}
              a={a}
              b={b}
            />
          ))}
        </tbody>
      </table>

      <ul className="compare-conclusions">
        <li>
          <strong>{a.gpn}</strong> — {unknownsA} unknown
          {unknownsA === 1 ? '' : 's'}. {unknownsA > 0 ? 'Needs a manufacturer catalogue page or engineering sign-off to clear.' : 'Fully specified.'}
        </li>
        <li>
          <strong>{b.gpn}</strong> — {unknownsB} unknown
          {unknownsB === 1 ? '' : 's'}. {unknownsB > 0 ? 'Needs a manufacturer catalogue page or engineering sign-off to clear.' : 'Fully specified.'}
        </li>
      </ul>
    </div>
  );
}
