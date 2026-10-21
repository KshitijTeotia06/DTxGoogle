import type { ResultVerdict } from '../../types';

const LABEL: Record<ResultVerdict, string> = {
  match: 'Match',
  review: 'Needs review',
  different: 'Different',
};

export function VerdictBadge({ verdict }: { verdict: ResultVerdict }) {
  return (
    <span
      className={`verdict verdict-${verdict}`}
      aria-label={`Verdict: ${LABEL[verdict]}`}
    >
      {LABEL[verdict]}
    </span>
  );
}
