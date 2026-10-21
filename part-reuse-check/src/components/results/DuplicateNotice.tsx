import type { DuplicateCluster } from '../../types';
import { useDispatch } from '../../state/context';
import { labelFor } from '../../engine/match';

export function DuplicateNotice({ cluster }: { cluster: DuplicateCluster }) {
  const dispatch = useDispatch();
  const evidence =
    cluster.evidence === 'shared-mpn'
      ? 'same manufacturer part number'
      : 'identical description';
  const hasConflicts = cluster.conflictingKeys.length > 0;
  return (
    <aside
      className={`cluster-notice ${hasConflicts ? 'has-conflicts' : ''}`}
      role="note"
    >
      <header className="cluster-head">
        <strong>
          {hasConflicts
            ? 'These GPNs share an identifier but disagree on specs:'
            : 'These GPNs may describe the same part:'}
        </strong>
        <ul className="cluster-gpns">
          {cluster.gpns.map((g) => (
            <li key={g}>
              <code>{g}</code>
            </li>
          ))}
        </ul>
      </header>
      <p className="cluster-evidence">
        Evidence: {evidence} —{' '}
        <code className="cluster-evalue">{cluster.evidenceValue}</code>
      </p>
      {hasConflicts ? (
        <p className="cluster-conflicts">
          Conflict on:{' '}
          {cluster.conflictingKeys.map((k, i) => (
            <span key={k} className="chip chip-conflict">
              {i > 0 ? ' ' : ''}
              {labelFor(k)}
            </span>
          ))}{' '}
          — treat with care; a shared MPN with conflicting specs is a data
          issue, not confirmation they are the same part.
        </p>
      ) : null}
      <div className="cluster-actions">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() =>
            dispatch({ type: 'FLAG_CLUSTER', clusterId: cluster.id })
          }
        >
          Flag to data owner
        </button>
        <span className="cluster-nope">
          Flagging is in-memory only — nothing leaves this browser tab.
        </span>
      </div>
    </aside>
  );
}
