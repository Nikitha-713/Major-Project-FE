import { Link } from 'react-router-dom';
import { detectTimezone, formatDate } from '../../utils/time.js';
import Button from '../common/Button.jsx';

const COLUMNS = [
  { key: 'name', label: 'Client', sortable: true },
  { key: 'lastSession', label: 'Last session', sortable: true },
  { key: 'nextSession', label: 'Next session', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'intake', label: 'Intake' },
  { key: 'tags', label: 'Tags' },
  { key: 'actions', label: 'Action' }, // <--- NEW COLUMN
];

const STATUS_STYLE = {
  active: 'bg-tide/10 text-tide-dark',
  inactive: 'bg-signal/30 text-ink',
  archived: 'bg-mist text-ink/70',
};

export default function ClientTable({ clients, sort, order, onSort, onMessageClick }) {
  const tz = detectTimezone();
  const show = (iso) => (iso ? formatDate(iso, tz) : '—');

  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-mist">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-mist">
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} scope="col" className="px-4 py-3 font-semibold"
                aria-sort={sort === col.key ? (order === 'asc' ? 'ascending' : 'descending') : undefined}>
                {col.sortable ? (
                  <button type="button" onClick={() => onSort(col.key)} className="inline-flex items-center gap-1 hover:text-tide">
                    {col.label}
                    <span aria-hidden="true" className="text-xs text-ink/50">
                      {sort === col.key ? (order === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                ) : col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id} className="border-b border-mist last:border-0 hover:bg-fog/60">
              <td className="px-4 py-3">
                <Link to={`/dashboard/clients/${c.id}`} className="font-semibold text-tide underline">{c.name}</Link>
                <div className="text-xs text-ink/60">{c.email}</div>
              </td>
              <td className="px-4 py-3">{show(c.lastSession)}</td>
              <td className="px-4 py-3">{show(c.nextSession)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[c.status]}`}>{c.status}</span>
              </td>
              <td className="px-4 py-3">{c.intakeCompleted ? 'Complete' : <span className="text-ink/60">Pending</span>}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {c.tags.map((t) => <span key={t} className="rounded-full bg-fog px-2 py-0.5 text-xs">{t}</span>)}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                {/* THIS IS THE MESSAGE BUTTON */}
                <Button variant="secondary" onClick={() => onMessageClick(c)}>Message</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}