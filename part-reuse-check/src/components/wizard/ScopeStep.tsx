import { useAppState, useDispatch } from '../../state/context';
import type { LifecyclePhase } from '../../types';
import { selectSteps } from '../../state/selectors';

const ALL_PHASES: LifecyclePhase[] = [
  'Production',
  'Preliminary',
  'Planning',
  'Prototype',
  'End of Production',
  'Sunset',
  'Obsolete',
];

export function ScopeStep() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);
  const scope = state.query.scope;

  function toggle(p: LifecyclePhase) {
    const has = scope.phases.includes(p);
    dispatch({
      type: 'SET_SCOPE',
      scope: {
        phases: has ? scope.phases.filter((x) => x !== p) : [...scope.phases, p],
      },
    });
  }

  return (
    <section className="step">
      <header className="step-header">
        <div className="step-progress">
          Step {state.stepIndex + 1} of {steps.length}
        </div>
        <h2 className="step-prompt">Which parts should we search?</h2>
        <p className="step-help">
          Pick which lifecycle phases are in play and whether kits (bundled parts) are included.
          Defaults match a "building something new" case.
        </p>
      </header>

      <div className="scope-grid">
        <fieldset className="scope-phases">
          <legend>Lifecycle phases</legend>
          {ALL_PHASES.map((p) => (
            <label key={p} className="scope-check">
              <input
                type="checkbox"
                checked={scope.phases.includes(p)}
                onChange={() => toggle(p)}
              />
              <span>{p}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="scope-toggles">
          <legend>Other filters</legend>
          <label className="scope-check">
            <input
              type="checkbox"
              checked={scope.allowKits}
              onChange={() =>
                dispatch({ type: 'SET_SCOPE', scope: { allowKits: !scope.allowKits } })
              }
            />
            <span>Include kits (bundles of parts)</span>
          </label>
          <label className="scope-check">
            <input
              type="checkbox"
              checked={scope.strict}
              onChange={() =>
                dispatch({ type: 'SET_SCOPE', scope: { strict: !scope.strict } })
              }
            />
            <span>Hide parts with unknown specs (strict mode)</span>
          </label>
          <p className="scope-hint">
            Default is <em>inclusive</em>: a part survives unless it <strong>states</strong> a different value for something you answered.
            Turn strict on to drop any part that leaves one of your attributes blank — this is faster to read but hides exactly the duplicates this tool exists to surface.
          </p>
        </fieldset>
      </div>

      <footer className="step-footer">
        <div className="step-controls">
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'BACK' })}>
            ← Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'GOTO_STEP', index: steps.length - 1 })}
          >
            Continue to review →
          </button>
        </div>
      </footer>
    </section>
  );
}
