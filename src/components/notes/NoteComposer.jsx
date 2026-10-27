import { useEffect, useState } from 'react';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import Button from '../common/Button.jsx';
import SoapTemplate from './SoapTemplate.jsx';
import { detectTimezone, formatDateTime } from '../../utils/time.js';

const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] };
const LINKABLE = ['confirmed', 'completed', 'no_show'];
const input = 'mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm';

// Create a note (pass `clientId`, or `clients` to show a client picker) or edit one (pass `note`).
export default function NoteComposer({ templates, clientId, clients, sessions: sessionsProp, note, onSaved, onCancel }) {
  const editing = Boolean(note);
  const tz = detectTimezone();
  const [pickedClient, setPickedClient] = useState('');
  const activeClient = clientId || (note && note.clientId) || pickedClient;

  const [sessions, setSessions] = useState(sessionsProp || []);
  const [sessionId, setSessionId] = useState((note && note.session && note.session.id) || '');
  const [type, setType] = useState(note ? note.type : 'private');
  const [format, setFormat] = useState(note ? note.format : 'freeform');
  const [title, setTitle] = useState(note ? note.title : '');
  const [values, setValues] = useState(() => Object.fromEntries(((note && note.sections) || []).map((s) => [s.key, s.content])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Sessions to link the note to: passed in, or loaded for whichever client is chosen.
  useEffect(() => {
    if (sessionsProp || !activeClient) return;
    let live = true;
    axiosInstance.get(`/clients/${activeClient}`)
      .then((res) => { if (live) setSessions(res.data.sessions || []); })
      .catch(() => { if (live) setSessions([]); });
    return () => { live = false; };
  }, [activeClient, sessionsProp]);

  const template = templates.find((t) => t.key === format) || templates[0];
  const linkable = sessions.filter((s) => LINKABLE.includes(s.status));

  const save = async (e) => {
    e.preventDefault();
    setError('');
    if (!activeClient) return setError('Choose a client first');
    if (type === 'shared' && !(editing && note.type === 'shared')) {
      const ok = window.confirm('This note will be visible to the client, exactly as written, in their portal. Save it as shared?');
      if (!ok) return;
    }
    const payload = {
      type,
      title,
      session: sessionId || null,
      sections: template.sections.map((s) => ({ key: s.key, content: values[s.key] || EMPTY_DOC })),
    };
    setSaving(true);
    try {
      const res = editing
        ? await axiosInstance.patch(`/notes/${note.id}`, payload)
        : await axiosInstance.post('/notes', { ...payload, client: activeClient, format });
      onSaved(res.data.note);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5 rounded-xl bg-white p-5 ring-1 ring-mist" aria-label={editing ? 'Edit note' : 'New note'}>
      <div className="grid gap-4 sm:grid-cols-2">
        {!clientId && !editing && (
          <label className="text-sm font-semibold sm:col-span-2">
            Client
            <select className={input} value={pickedClient} onChange={(e) => { setPickedClient(e.target.value); setSessionId(''); setSessions([]); }} required>
              <option value="">Choose a client</option>
              {(clients || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
        <label className="text-sm font-semibold">
          Format
          <select className={input} value={format} disabled={editing} onChange={(e) => setFormat(e.target.value)}>
            {templates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Session (optional)
          <select className={input} value={sessionId} onChange={(e) => setSessionId(e.target.value)} disabled={!activeClient}>
            <option value="">Not linked to a session</option>
            {linkable.map((s) => <option key={s._id} value={s._id}>{formatDateTime(s.startTime, tz)} · {s.serviceTitle}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Title (optional)
          <input className={input} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Session 3, sleep and worry" />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Who can read this note?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[
            ['private', 'Private', 'Only you. This is your clinical record and is never sent to the client.'],
            ['shared', 'Shared with client', 'The client can read it in their portal, for example homework or a session summary.'],
          ].map(([value, name, text]) => (
            <label key={value} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${type === value ? 'border-tide bg-fog' : 'border-mist'}`}>
              <input type="radio" name="note-type" value={value} checked={type === value} onChange={() => setType(value)} className="mt-1" />
              <span><span className="block font-semibold">{name}</span><span className="text-ink/70">{text}</span></span>
            </label>
          ))}
        </div>
      </fieldset>

      <SoapTemplate format={format} template={template} values={values} onChange={(key, doc) => setValues((v) => ({ ...v, [key]: doc }))} />

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Save note'}</Button>
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
