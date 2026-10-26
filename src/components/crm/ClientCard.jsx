import { useState } from 'react';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import Button from '../common/Button.jsx';

const field = 'rounded-lg border border-mist bg-white px-3 py-2 text-sm';

export default function ClientCard({ client, onUpdated }) {
  const [tags, setTags] = useState(client.tags.join(', '));
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);

  const portalUrl = `${window.location.origin}/portal/${client.portalToken}`;

  const save = async (patch, okText) => {
    setMessage({ type: '', text: '' });
    try {
      const res = await axiosInstance.patch(`/clients/${client.id}`, patch);
      onUpdated(res.data.client);
      setMessage({ type: 'ok', text: okText });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="rounded-xl bg-white p-6 ring-1 ring-mist">
      <h1 className="font-display text-3xl font-bold">{client.name}</h1>
      <p className="mt-1 text-ink/70">
        {client.email}{client.phone ? ` · ${client.phone}` : ''} · {client.timezone}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className="block text-sm font-medium">Status</label>
          <select id="status" className={`${field} mt-1 w-full`} value={client.status}
            onChange={(e) => save({ status: e.target.value }, 'Status updated')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="tags" className="block text-sm font-medium">Tags</label>
          <div className="mt-1 flex gap-2">
            <input id="tags" className={`${field} w-full`} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="anxiety, weekly" />
            <Button type="button" variant="secondary"
              onClick={() => save({ tags: tags.split(',').map((t) => t.trim()).filter(Boolean) }, 'Tags saved')}>Save</Button>
          </div>
          <p className="mt-1 text-xs text-ink/60">Separate with commas</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-fog p-4">
        <p className="text-sm font-medium">Client portal link</p>
        <p className="mt-1 text-xs text-ink/60">Send this to the client so they can complete their intake form. Anyone with the link can open it, so share it privately.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 truncate text-xs">{portalUrl}</code>
          <Button type="button" variant="secondary" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</Button>
        </div>
      </div>

      {message.text && (
        <p role={message.type === 'error' ? 'alert' : 'status'}
          className={`mt-3 text-sm ${message.type === 'error' ? 'text-danger' : 'text-tide'}`}>{message.text}</p>
      )}
    </section>
  );
}
