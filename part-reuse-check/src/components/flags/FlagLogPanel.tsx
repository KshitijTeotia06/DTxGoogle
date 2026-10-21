import { useAppState, useDispatch } from '../../state/context';
import { selectAllClusters } from '../../state/selectors';

export function FlagLogPanel() {
  const state = useAppState();
  const dispatch = useDispatch();
  const clusters = selectAllClusters();
  const byId = new Map(clusters.map((c) => [c.id, c]));

  return (
    <div className="flags">
      <header className="flags-head">
        <h2>Flag log</h2>
        <button
          className="btn btn-ghost"
          onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: state.results ? 'results' : 'wizard' })}
        >
          ← Back
        </button>
      </header>
      <p className="flags-note">
        <strong>In-memory only.</strong> Flagging in this prototype does not send anything, anywhere.
      </p>
      {state.flags.length === 0 ? (
        <p>
          No clusters flagged yet. When you spot a shared-MPN or duplicate-description notice on the Results screen, use <em>Flag to data owner</em> to add it here.
        </p>
      ) : (
        <ul className="flags-list">
          {state.flags.map((f) => {
            const c = byId.get(f.clusterId);
            return (
              <li key={f.clusterId}>
                <div>
                  <strong>{f.clusterId}</strong>
                  <span className="flags-at"> · {f.at}</span>
                </div>
                {c ? (
                  <div className="flags-gpns">
                    GPNs: {c.gpns.join(', ')}
                  </div>
                ) : null}
                <div className="flags-note-row">{f.note}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
