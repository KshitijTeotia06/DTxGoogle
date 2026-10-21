import { useMemo, useRef, useState, KeyboardEvent } from 'react';
import type { VocabOption } from '../../types';

export interface OptionComboboxProps {
  options: VocabOption[];
  value: string | number | null;
  onSelect: (canonical: string) => void;
  placeholder: string;
  renderCount?: (option: VocabOption) => string;
}

export function OptionCombobox({
  options,
  value,
  onSelect,
  placeholder,
  renderCount,
}: OptionComboboxProps) {
  const [filter, setFilter] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      if (o.label.toLowerCase().includes(q)) return true;
      if (o.canonical.toLowerCase().includes(q)) return true;
      if (o.rawVariants.some((v) => v.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [filter, options]);

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const choice = filtered[highlight];
      if (choice) onSelect(choice.canonical);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFilter('');
    }
  }

  return (
    <div className="combobox">
      <input
        ref={inputRef}
        className="combobox-input"
        type="text"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setHighlight(0);
        }}
        onKeyDown={onKey}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
      />
      <ul className="combobox-list" role="listbox">
        {filtered.length === 0 ? (
          <li className="combobox-empty">
            No options match "{filter}". Try a different term or Skip this step.
          </li>
        ) : (
          filtered.map((o, i) => {
            const selected =
              value !== null && String(value) === o.canonical;
            return (
              <li
                key={o.canonical}
                role="option"
                aria-selected={selected}
                className={`combobox-option${
                  i === highlight ? ' is-highlighted' : ''
                }${selected ? ' is-selected' : ''}`}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => onSelect(o.canonical)}
              >
                <span className="combobox-label">{o.label}</span>
                <span className="combobox-count">
                  {renderCount ? renderCount(o) : `${o.count}`}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
