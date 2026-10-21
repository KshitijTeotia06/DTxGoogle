import type {
  Answer,
  AttributeKey,
  PartRecord,
  StepDefinition,
} from '../../types';
import { compareAttribute } from '../../engine/match';

export function CompareRow({
  step,
  answer,
  a,
  b,
}: {
  step: StepDefinition;
  answer: Answer | undefined;
  a: PartRecord | undefined;
  b: PartRecord | undefined;
}) {
  function cell(part: PartRecord | undefined) {
    if (!part) return <span className="cmp-cell cmp-unknown">—</span>;
    const found = (part.attributes as any)[step.key] as string | number | null;
    const cmp = compareAttribute(step.key as AttributeKey, answer, found);
    const show = found === null ? 'unknown' : String(found) + (step.unit === 'mm' ? ' mm' : '');
    return (
      <span className={`cmp-cell cmp-${cmp.verdict}`}>
        <span className="cmp-marker" aria-hidden="true">
          {cmp.verdict === 'match'
            ? '✓'
            : cmp.verdict === 'differs'
            ? '✕'
            : cmp.verdict === 'unknown'
            ? '?'
            : '·'}
        </span>
        <span className="cmp-value">{show}</span>
      </span>
    );
  }

  const askedText =
    !answer || answer.state !== 'answered'
      ? 'not asked'
      : String(answer.value) + (step.unit === 'mm' ? ' mm' : '');

  return (
    <tr className={`cmp-row ${!answer || answer.state !== 'answered' ? 'is-skipped' : ''}`}>
      <th scope="row">
        <div className="cmp-prompt">{step.prompt}</div>
      </th>
      <td className="cmp-asked">{askedText}</td>
      <td>{cell(a)}</td>
      <td>{cell(b)}</td>
    </tr>
  );
}
