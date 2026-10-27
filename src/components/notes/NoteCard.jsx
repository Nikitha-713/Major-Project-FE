import { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import RichTextView from './RichTextView.jsx';
import { detectTimezone, formatDate, formatDateTime } from '../../utils/time.js';

export default function NoteCard({ note, showClient, onEdit, onChanged, onDeleted }) {
  const tz = detectTimezone();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const shared = note.type === 'shared';

  const toggleVisibility = async () => {
    if (!shared && !window.confirm('The client will be able to read this note, exactly as written, in their portal. Share it?')) return;
    setBusy(true);
    setError('');
    try {
      const res = await axiosInstance.patch(`/notes/${note.id}`, { type: shared ? 'private' : 'shared' });
      onChanged(res.data.note);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this note permanently? This can not be undone.')) return;
    setBusy(true);
    setError('');
    try {
      await axiosInstance.delete(`/notes/${note.id}`);
      onDeleted(note.id);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  const btn = 'font-medium text-tide underline disabled:opacity-50';

  return (
    <article className="rounded-xl bg-white p-5 ring-1 ring-mist">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-bold">{note.title || 'Untitled note'}</h3>
          <p className="text-xs text-ink/60">
            {showClient && note.clientName && (
              <><Link to={`/dashboard/clients/${note.clientId}`} className="text-tide underline">{note.clientName}</Link> · </>
            )}
            {note.format.toUpperCase() === 'FREEFORM' ? 'Free-form' : note.format.toUpperCase()} · written {formatDate(note.createdAt, tz)}
            {note.session && <> · session {formatDateTime(note.session.startTime, tz)}</>}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${shared ? 'bg-signal/30 text-ink' : 'bg-fog text-ink'}`}>
          {shared ? 'Shared with client' : 'Private'}
        </span>
      </header>

      <div className="mt-4 space-y-3">
        {note.sections.map((s) => (
          <section key={s.key}>
            {note.sections.length > 1 && <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/60">{s.label}</h4>}
            <RichTextView doc={s.content} />
          </section>
        ))}
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <footer className="mt-4 flex flex-wrap gap-4 border-t border-mist pt-3 text-sm">
        <button type="button" className={btn} disabled={busy} onClick={() => onEdit(note)}>Edit</button>
        <button type="button" className={btn} disabled={busy} onClick={toggleVisibility}>{shared ? 'Make private' : 'Share with client'}</button>
        <button type="button" className="font-medium text-danger underline disabled:opacity-50" disabled={busy} onClick={remove}>Delete</button>
      </footer>
    </article>
  );
}
