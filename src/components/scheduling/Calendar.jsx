import { useMemo, useState } from 'react';
import { formatMonth, todayKey } from '../../utils/time.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const pad = (n) => String(n).padStart(2, '0');
const monthIndexOf = (key) => Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1;

// Month grid. Only days that have at least one open slot can be clicked.
export default function Calendar({ availableDates, selected, onSelect }) {
  const available = useMemo(() => new Set(availableDates), [availableDates]);
  const first = availableDates[0];
  const last = availableDates[availableDates.length - 1];

  const start = selected || first || todayKey();
  const [view, setView] = useState({ year: Number(start.slice(0, 4)), month: Number(start.slice(5, 7)) - 1 });

  const viewIndex = view.year * 12 + view.month;
  const canPrev = first && viewIndex > monthIndexOf(first);
  const canNext = last && viewIndex < monthIndexOf(last);

  const shift = (delta) => {
    const idx = viewIndex + delta;
    setView({ year: Math.floor(idx / 12), month: idx % 12 });
  };

  const leadingBlanks = (new Date(Date.UTC(view.year, view.month, 1)).getUTCDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-mist">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} aria-label="Previous month"
          className="rounded-lg px-3 py-1 text-lg hover:bg-fog disabled:opacity-30">‹</button>
        <p className="font-display font-bold">{formatMonth(view.year, view.month)}</p>
        <button type="button" onClick={() => shift(1)} disabled={!canNext} aria-label="Next month"
          className="rounded-lg px-3 py-1 text-lg hover:bg-fog disabled:opacity-30">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink/60">
        {WEEKDAYS.map((d) => <span key={d} className="py-1">{d}</span>)}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }, (_, i) => <span key={`blank-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const key = `${view.year}-${pad(view.month + 1)}-${pad(day)}`;
          const isAvailable = available.has(key);
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              className={`aspect-square rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-tide font-semibold text-white'
                  : isAvailable
                  ? 'bg-fog font-semibold text-tide hover:bg-mist'
                  : 'text-ink/30'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
