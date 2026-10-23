import { Fragment, useState } from 'react';
import type {
  AttributeKey,
  DuplicateCluster,
  MatchResult,
  StepDefinition,
} from '../../types';
import { useAppState, useDispatch } from '../../state/context';
import { selectSteps } from '../../state/selectors';
import { compareAttribute, labelFor } from '../../engine/match';
import { VerdictBadge } from '../common/VerdictBadge';
import { DuplicateNotice } from './DuplicateNotice';

interface Props {
  rows: MatchResult[];
  columns: StepDefinition[];
  clustersByGpn: Map<string, DuplicateCluster[]>;
}

function formatValue(v: string | number | null, unit?: 'mm'): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return `${v}${unit === 'mm' ? ' mm' : ''}`;
  return String(v);
}

export function ResultsTable({ rows, columns, clustersByGpn }: Props) {
  const state = useAppState();
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const allSteps = selectSteps(state).filter(
    (s) => s.key !== ('__scope__' as any) && s.key !== ('__review__' as any)
  );

  function toggle(gpn: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(gpn)) n.delete(gpn);
      else n.add(gpn);
      return n;
    });
  }

  function askedLabel(col: StepDefinition): { text: string; cls: string } {
    const a = state.query.answers[col.key];
    if (!a || a.state === 'pending') return { text: 'not asked', cls: 'ask-none' };
    if (a.state === 'skipped')      return { text: 'skipped',   cls: 'ask-skip' };
    return {
      text: formatValue(a.value as any, col.unit),
      cls: 'ask-set',
    };
  }

  function cellFor(result: MatchResult, col: StepDefinition) {
    const asked = state.query.answers[col.key];
    const found = (result.part.attributes as any)[col.key] as string | number | null;
    const cmp = compareAttribute(col.key as AttributeKey, asked, found);
    const marker =
      cmp.verdict === 'match'
        ? '✓'
        : cmp.verdict === 'differs'
        ? '✕'
        : cmp.verdict === 'unknown'
        ? '?'
        : '·';
    const display =
      cmp.verdict === 'unknown' ? 'unknown' : formatValue(found, col.unit);
    return (
      <td
        key={col.key as string}
        className={`rt-cell rt-${cmp.verdict}`}
        title={`${col.prompt.replace(/\?$/, '')} — ${display}`}
      >
        <span className="rt-mark" aria-hidden="true">{marker}</span>
        <span className="rt-val">{display}</span>
      </td>
    );
  }

  const totalCols = 4 + columns.length + 1;

  return (
    <div className="results-table-wrap">
      <table className="results-table">
        <thead>
          <tr>
            <th className="col-check" aria-label="Compare" />
            <th className="col-gpn">GPN</th>
            <th className="col-verdict">Verdict</th>
            <th className="col-phase">Phase</th>
            {columns.map((c) => {
              const ask = askedLabel(c);
              return (
                <th
                  key={c.key as string}
                  className={`col-attr ${ask.cls}`}
                  scope="col"
                >
                  <div className="th-prompt">{c.prompt.replace(/\?$/, '')}</div>
                  <div className={`th-asked th-${ask.cls}`}>
                    <span className="th-asked-kicker">you asked</span>
                    <span className="th-asked-val">
                      {ask.text}
                      {ask.cls === 'ask-set' && c.unit === 'mm' ? '' : ''}
                    </span>
                  </div>
                </th>
              );
            })}
            <th className="col-expand" aria-label="Expand" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="empty-cell">
                No matches or review candidates. Try loosening a step —
                pitch, finish, or integral washer are stated by only a
                minority of records.
              </td>
            </tr>
          ) : null}
          {rows.map((r) => {
            const isExpanded = expanded.has(r.part.gpn);
            const checked = state.compareGpns.includes(r.part.gpn);
            const myClusters = clustersByGpn.get(r.part.gpn) ?? [];
            return (
              <Fragment key={r.part.gpn}>
                <tr
                  className={`row-result row-${r.verdict}${
                    isExpanded ? ' is-expanded' : ''
                  }`}
                >
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      aria-label={`Select ${r.part.gpn} for compare`}
                      onChange={() =>
                        dispatch({ type: 'TOGGLE_COMPARE', gpn: r.part.gpn })
                      }
                    />
                  </td>
                  <td className="col-gpn">
                    <button
                      className="gpn-btn"
                      onClick={() => toggle(r.part.gpn)}
                      aria-expanded={isExpanded}
                    >
                      {r.part.gpn}
                    </button>
                    {myClusters.length > 0 ? (
                      <span
                        className="cluster-flag"
                        title="Part of a duplicate cluster"
                      >
                        dup
                      </span>
                    ) : null}
                  </td>
                  <td className="col-verdict">
                    <VerdictBadge verdict={r.verdict} />
                  </td>
                  <td className="col-phase">{r.part.phase}</td>
                  {columns.map((c) => cellFor(r, c))}
                  <td className="col-expand">
                    <button
                      className="expand-btn"
                      onClick={() => toggle(r.part.gpn)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Collapse' : 'Expand details'}
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="row-detail">
                    <td colSpan={totalCols}>
                      <div className="detail-grid">
                        <div className="detail-desc">
                          <h4>Description</h4>
                          <blockquote>"{r.part.description}"</blockquote>
                          <p className="detail-sources">
                            {r.part.sources.map((s, i) => (
                              <span key={i} className="src">
                                {s.sheet} r{s.row}
                              </span>
                            ))}
                            {' · '}
                            {r.part.manufacturers.length} manufacturer
                            {r.part.manufacturers.length === 1 ? '' : 's'}
                            {r.part.packaging.isKit ? ' · kit' : ''}
                            {r.part.packaging.quantity
                              ? ` · qty ${r.part.packaging.quantity}`
                              : ''}
                          </p>
                        </div>
                        <div className="detail-attrs">
                          <h4>All attributes</h4>
                          <dl className="detail-dl">
                            {allSteps.map((s) => {
                              const found = (r.part.attributes as any)[s.key];
                              const asked = state.query.answers[s.key];
                              const cmp = compareAttribute(
                                s.key as AttributeKey,
                                asked,
                                found
                              );
                              return (
                                <div
                                  key={s.key as string}
                                  className={`dl-row dl-${cmp.verdict}`}
                                >
                                  <dt>{s.prompt.replace(/\?$/, '')}</dt>
                                  <dd>
                                    {found === null || found === undefined
                                      ? 'unknown'
                                      : formatValue(found, s.unit)}
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>
                        </div>
                        {r.part.manufacturers.length > 0 ? (
                          <div className="detail-mfrs">
                            <h4>Manufacturers</h4>
                            <ul>
                              {r.part.manufacturers.slice(0, 8).map((m, i) => (
                                <li key={i}>
                                  {m.name || 'unknown vendor'}{' '}
                                  <code>{m.partNumber || '—'}</code>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                      {myClusters.map((c) => (
                        <DuplicateNotice key={c.id} cluster={c} />
                      ))}
                      {r.verdict === 'review' && r.unknownKeys.length > 0 ? (
                        <p className="detail-unknowns">
                          <strong>Why "needs review":</strong>{' '}
                          {r.unknownKeys.length} attribute
                          {r.unknownKeys.length === 1 ? '' : 's'} you asked
                          about {r.unknownKeys.length === 1 ? 'is' : 'are'} not
                          stated in the description —{' '}
                          {r.unknownKeys
                            .map((k) => labelFor(k as AttributeKey))
                            .join(', ')}
                          .
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
