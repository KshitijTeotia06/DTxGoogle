export function ResultsLegend() {
  return (
    <div className="legend" role="note" aria-label="Cell colour key">
      <span className="legend-label">Cell colours</span>
      <span className="legend-item">
        <span className="legend-swatch sw-match" aria-hidden="true">✓</span>
        <span>record states your value</span>
      </span>
      <span className="legend-item">
        <span className="legend-swatch sw-unknown" aria-hidden="true">?</span>
        <span>record does not say</span>
      </span>
      <span className="legend-item">
        <span className="legend-swatch sw-differs" aria-hidden="true">✕</span>
        <span>record states a different value</span>
      </span>
      <span className="legend-item">
        <span className="legend-swatch sw-not-asked" aria-hidden="true">·</span>
        <span>you did not ask</span>
      </span>
    </div>
  );
}
