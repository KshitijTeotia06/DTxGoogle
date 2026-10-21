import { useMemo, useState } from 'react';
import { useAppState } from '../../state/context';
import { selectSteps } from '../../state/selectors';

export function NewGpnRequest() {
  const state = useAppState();
  const steps = selectSteps(state);
  const [copied, setCopied] = useState<string | null>(null);

  const text = useMemo(() => {
    const lines: string[] = [];
    lines.push('Part Reuse Check — New GPN request (mock)');
    lines.push('Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('Query:');
    for (const s of steps) {
      if (s.key === ('__scope__' as any) || s.key === ('__review__' as any)) continue;
      const a = state.query.answers[s.key];
      const v =
        a?.state === 'answered'
          ? String(a.value) + (s.unit === 'mm' ? ' mm' : '')
          : a?.state === 'skipped'
          ? 'skipped'
          : 'not answered';
      lines.push(`  ${s.prompt.replace(/\?$/, '')}: ${v}`);
    }
    lines.push(
      `  Scope: ${state.query.scope.phases.join(', ')}${state.query.scope.allowKits ? ' + kits' : ''}${state.query.scope.strict ? ' + strict' : ''}`
    );
    lines.push('');
    lines.push('Rejected candidates (nearest misses):');
    const rejected = state.results?.filter((r) => r.verdict === 'different') ?? [];
    if (rejected.length === 0) lines.push('  (none)');
    for (const r of rejected.slice(0, 10)) {
      lines.push(`  ${r.part.gpn} — ${r.exclusionReason}`);
    }
    lines.push('');
    lines.push('NOTE: This request is NOT submitted anywhere. Copy and send to a human.');
    return lines.join('\n');
  }, [state, steps]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied('Copied to clipboard.');
    } catch {
      setCopied('Could not copy automatically. Select the text and copy manually.');
    }
  }

  return (
    <div className="new-gpn">
      <div className="new-gpn-head">
        <h3>Draft new-GPN request</h3>
        <button className="btn btn-primary" onClick={copy}>
          Copy to clipboard
        </button>
      </div>
      <pre className="new-gpn-body" tabIndex={0}>
        {text}
      </pre>
      {copied ? <p className="new-gpn-copied">{copied}</p> : null}
      <p className="new-gpn-nope">
        <strong>Not sent anywhere.</strong> The prototype has no backend.
      </p>
    </div>
  );
}
