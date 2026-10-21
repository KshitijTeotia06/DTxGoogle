import { useAppState, useDispatch } from './state/context';
import { PrototypeBanner } from './components/common/PrototypeBanner';
import { WizardScreen } from './components/wizard/WizardScreen';
import { ResultsScreen } from './components/results/ResultsScreen';
import { CompareScreen } from './components/compare/CompareScreen';
import { DeadEndScreen } from './components/deadend/DeadEndScreen';
import { FlagLogPanel } from './components/flags/FlagLogPanel';

export default function App() {
  const state = useAppState();
  const dispatch = useDispatch();

  return (
    <div className="app">
      <PrototypeBanner />

      <header className="app-top">
        <div className="brand">
          <span className="brand-mark">PR</span>
          <div className="brand-text">
            <h1>Part Reuse Check</h1>
            <p>Find an existing GPN before you create a new one.</p>
          </div>
        </div>
        <nav className="app-nav">
          <button
            className={state.screen === 'wizard' ? 'is-current' : ''}
            onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' })}
          >
            Query
          </button>
          <button
            className={state.screen === 'results' ? 'is-current' : ''}
            onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'results' })}
            disabled={!state.results}
          >
            Results{state.results ? ` (${state.results.filter((r) => r.verdict !== 'different').length})` : ''}
          </button>
          <button
            className={state.screen === 'compare' ? 'is-current' : ''}
            onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'compare' })}
            disabled={state.compareGpns.length !== 2}
          >
            Compare
          </button>
          <button
            className={state.screen === 'flags' ? 'is-current' : ''}
            onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'flags' })}
          >
            Flag log{state.flags.length ? ` (${state.flags.length})` : ''}
          </button>
        </nav>
      </header>

      <main className="app-main">
        {state.screen === 'wizard' && <WizardScreen />}
        {state.screen === 'results' && <ResultsScreen />}
        {state.screen === 'compare' && <CompareScreen />}
        {state.screen === 'deadEnd' && <DeadEndScreen />}
        {state.screen === 'flags' && <FlagLogPanel />}
      </main>

      <footer className="app-foot">
        Prototype — demo build, no persistence.
      </footer>
    </div>
  );
}
