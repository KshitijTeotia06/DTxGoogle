import { useAppState } from '../../state/context';
import { selectCurrentStep } from '../../state/selectors';
import { AttributeStep } from './AttributeStep';
import { ReviewStep } from './ReviewStep';
import { ScopeStep } from './ScopeStep';
import { ProgressRail } from './ProgressRail';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';

export function WizardScreen() {
  const state = useAppState();
  const step = selectCurrentStep(state);
  return (
    <div className="wizard">
      <ProgressRail />
      <main className="wizard-main">
        {step.key === SCOPE_STEP_KEY ? (
          <ScopeStep />
        ) : step.key === REVIEW_STEP_KEY ? (
          <ReviewStep />
        ) : (
          <AttributeStep />
        )}
      </main>
    </div>
  );
}
