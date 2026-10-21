import { useState } from 'react';
import type { MatchResult } from '../../types';

export function ExcludedSummary({ excluded }: { excluded: MatchResult[] }) {
  const [open, setOpen] = useState(false);
  if (excluded.length === 0) return null;
  return (
    <div className="excluded">
      <button
        className="excluded-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? '▾' : '▸'} {excluded.length} record
        {excluded.length === 1 ? '' : 's'} excluded by your filters
      </button>
      {open ? (
        <ul className="excluded-list">
          {excluded.map((r) => (
            <li key={r.part.gpn}>
              <span className="excluded-gpn">{r.part.gpn}</span>
              <span className="excluded-reason"> — {r.exclusionReason}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
