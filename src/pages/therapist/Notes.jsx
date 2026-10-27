import { useEffect, useState } from 'react';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import NoteComposer from '../../components/notes/NoteComposer.jsx';
import NoteList from '../../components/notes/NoteList.jsx';
import useNoteTemplates from '../../hooks/useNoteTemplates.js';

const input = 'rounded-lg border border-mist bg-white px-3 py-2 text-sm';

export default function Notes() {
  const templates = useNoteTemplates();
  const [clients, setClients] = useState([]);
  const [notes, setNotes] = useState(null);
  const [error, setError] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    axiosInstance.get('/clients', { params: { limit: 50 } }).then((res) => setClients(res.data.clients)).catch(() => {});
  }, []);

  useEffect(() => {
    setNotes(null);
    setError('');
    axiosInstance.get('/notes', { params: { client: clientFilter || undefined, type: typeFilter || undefined } })
      .then((res) => setNotes(res.data.notes))
      .catch((err) => setError(getErrorMessage(err)));
  }, [clientFilter, typeFilter]);

  const replace = (saved) => setNotes((list) => list.map((n) => (n.id === saved.id ? saved : n)));
  const remove = (id) => setNotes((list) => list.filter((n) => n.id !== id));

  if (!templates) return <Loader label="Loading notes" />;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Session notes</h1>
          <p className="mt-1 text-ink/70">Every note you have written, newest first.</p>
        </div>
        {!adding && <Button onClick={() => setAdding(true)}>New note</Button>}
      </div>

      {adding && (
        <NoteComposer
          templates={templates}
          clients={clients}
          onCancel={() => setAdding(false)}
          onSaved={(saved) => { setAdding(false); setNotes((list) => [saved, ...(list || [])]); }}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <label className="text-sm font-semibold">
          <span className="sr-only">Filter by client</span>
          <select className={input} value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">
          <span className="sr-only">Filter by visibility</span>
          <select className={input} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Private and shared</option>
            <option value="private">Private only</option>
            <option value="shared">Shared only</option>
          </select>
        </label>
      </div>

      {error && <p role="alert" className="text-danger">{error}</p>}
      {!notes && !error && <Loader label="Loading notes" />}
      {notes && notes.length === 0 && <p className="text-ink/70">No notes found.</p>}
      {notes && notes.length > 0 && (
        <NoteList notes={notes} templates={templates} showClient onChanged={replace} onDeleted={remove} />
      )}
    </main>
  );
}
