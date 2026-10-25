import { formatTime } from '../../utils/time.js';

export default function SlotPicker({ slots, timezone, selected, onSelect }) {
  if (!slots.length) return <p className="text-sm text-ink/60">Pick a highlighted day to see times.</p>;

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {slots.map((iso) => (
        <li key={iso}>
          <button
            type="button"
            onClick={() => onSelect(iso)}
            aria-pressed={iso === selected}
            className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              iso === selected
                ? 'border-tide bg-tide text-white'
                : 'border-mist bg-white hover:border-tide hover:text-tide'
            }`}
          >
            {formatTime(iso, timezone)}
          </button>
        </li>
      ))}
    </ul>
  );
}
