import { useState } from 'react';
import NoteCard from './NoteCard.jsx';
import NoteComposer from './NoteComposer.jsx';

// A list of notes where "Edit" swaps a card for the editor in place.
export default function NoteList({ notes, templates, sessions, showClient, onChanged, onDeleted }) {
  const [editingId, setEditingId] = useState(null);
  return (
    <ul className="space-y-4">
      {notes.map((note) => (
        <li key={note.id}>
          {editingId === note.id ? (
            <NoteComposer
              templates={templates}
              note={note}
              sessions={sessions}
              onCancel={() => setEditingId(null)}
              onSaved={(saved) => { setEditingId(null); onChanged(saved); }}
            />
          ) : (
            <NoteCard note={note} showClient={showClient} onEdit={(n) => setEditingId(n.id)} onChanged={onChanged} onDeleted={onDeleted} />
          )}
        </li>
      ))}
    </ul>
  );
}
