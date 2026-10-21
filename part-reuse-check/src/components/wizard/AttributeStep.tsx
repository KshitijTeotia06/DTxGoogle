import { OptionCombobox } from '../common/OptionCombobox';
import { useAppState, useDispatch } from '../../state/context';
import {
  selectCurrentStep,
  selectOptionsForCurrentStep,
  selectPoolCounts,
  selectSteps,
} from '../../state/selectors';

export function AttributeStep() {
  const state = useAppState();
  const dispatch = useDispatch();
  const step = selectCurrentStep(state);
  const options = selectOptionsForCurrentStep(state);
  const counts = selectPoolCounts(state);
  const steps = selectSteps(state);

  const answer = state.query.answers[step.key];
  const current =
    answer?.state === 'answered' ? (answer.value as string | number) : null;

  return (
    <section className="step">
      <header className="step-header">
        <div className="step-progress">
          Step {state.stepIndex + 1} of {steps.length}
        </div>
        <h2 className="step-prompt">{step.prompt}</h2>
        <p className="step-help">{step.help}</p>
      </header>

      <OptionCombobox
        options={options}
        value={current}
        onSelect={(v) =>
          dispatch({
            type: 'ANSWER',
            key: step.key,
            value: step.kind === 'numeric' ? Number(v) : v,
          })
        }
        placeholder={
          step.kind === 'numeric'
            ? 'Type a value, like 8 or 0.5…'
            : 'Type to filter, Enter to pick…'
        }
      />

      <footer className="step-footer">
        <div className="pool-counts" aria-live="polite">
          <span className="pool-exact">
            <strong>{counts.exact}</strong> parts state a matching value
          </span>
          <span className="pool-sep">·</span>
          <span className="pool-unknown">
            <strong>{counts.unknown}</strong> more leave this attribute blank
          </span>
        </div>
        <div className="step-controls">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={state.stepIndex === 0}
            onClick={() => dispatch({ type: 'BACK' })}
          >
            ← Back
          </button>
          <button
            type="button"
            className="btn btn-skip"
            onClick={() => dispatch({ type: 'SKIP', key: step.key })}
          >
            Skip this step
          </button>
        </div>
      </footer>
    </section>
  );
}
