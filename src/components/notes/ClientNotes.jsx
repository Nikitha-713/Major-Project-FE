import { useEffect, useState } from 'react';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import Button from '../common/Button.jsx';
import NoteComposer from './NoteComposer.jsx';
import NoteList from './NoteList.jsx';
import useNoteTemplates from '../../hooks/useNoteTemplates.js';

// The "Session notes" section of a client's profile.
export default function ClientNotes({ clientId, sessions }) {
  const templates = useNoteTemplates();
  const [notes, setNotes] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    axiosInstance.get('/notes', { params: { client: clientId } })
      .then((res) => setNotes(res.data.notes))
      .catch((err) => setError(getErrorMessage(err)));
  }, [clientId]);

  const replace = (saved) => setNotes((list) => list.map((n) => (n.id === saved.id ? saved : n)));
  const remove = (id) => setNotes((list) => list.filter((n) => n.id !== id));

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Session notes</h2>
        {!adding && templates && templates.length > 0 && <Button onClick={() => setAdding(true)}>Add note</Button>}
      </div>
      <p className="mt-1 text-sm text-ink/70">Private notes are only visible to you. Shared notes also appear in this client's portal.</p>

      {error && <p role="alert" className="mt-3 text-danger">{error}</p>}

      {adding && templates && (
        <div className="mt-4">
          <NoteComposer
            templates={templates}
            clientId={clientId}
            sessions={sessions}
            onCancel={() => setAdding(false)}
            onSaved={(saved) => { setAdding(false); setNotes((list) => [saved, ...(list || [])]); }}
          />
        </div>
      )}

      {notes && notes.length === 0 && !adding && <p className="mt-3 text-ink/70">No notes yet.</p>}
      {notes && templates && notes.length > 0 && (
        <div className="mt-4">
          <NoteList notes={notes} templates={templates} sessions={sessions} onChanged={replace} onDeleted={remove} />
        </div>
      )}
    </section>
  );
}
