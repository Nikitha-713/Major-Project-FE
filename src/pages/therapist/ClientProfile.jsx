import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import ClientCard from '../../components/crm/ClientCard.jsx';
import Loader from '../../components/common/Loader.jsx';
import { detectTimezone, formatDate, formatDateTime } from '../../utils/time.js';
import { formatINR } from '../../utils/money.js';
import { downloadAuthedFile } from '../../utils/download.js';

const STATUS_LABEL = { confirmed: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' };

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-ink/60">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-line">{value}</dd>
    </div>
  );
}

export default function ClientProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const tz = detectTimezone();

  useEffect(() => {
    axiosInstance
      .get(`/clients/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p role="alert" className="text-danger">{error}</p>
        <Link to="/dashboard/clients" className="mt-4 inline-block text-tide underline">Back to clients</Link>
      </main>
    );
  }
  if (!data) return <Loader label="Loading client" />;

  const { client, sessions, consents, payments = [], packages = [] } = data;
  const intake = client.intake;

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-12">
      <div>
        <Link to="/dashboard/clients" className="text-sm text-tide underline">← All clients</Link>
        <div className="mt-3">
          <ClientCard client={client} onUpdated={(c) => setData((d) => ({ ...d, client: c }))} />
        </div>
      </div>

      <section>
        <h2 className="font-display text-xl font-bold">Sessions</h2>
        {sessions.length === 0 ? (
          <p className="mt-3 text-ink/70">No sessions yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sessions.map((s) => (
              <li key={s._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-4 ring-1 ring-mist">
                <div>
                  <p className="font-semibold">{formatDateTime(s.startTime, tz)}</p>
                  <p className="text-sm text-ink/70">{s.serviceTitle} · {s.durationMin} min</p>
                </div>
                <span className="rounded-full bg-fog px-2.5 py-1 text-xs font-medium">{STATUS_LABEL[s.status] || s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Intake form</h2>
        {!intake ? (
          <p className="mt-3 text-ink/70">Not completed yet. Share the portal link above so the client can fill it in.</p>
        ) : (
          <dl className="mt-3 grid gap-4 rounded-xl bg-white p-5 text-sm ring-1 ring-mist sm:grid-cols-2">
            <Row label="Date of birth" value={intake.demographics?.dateOfBirth && formatDate(intake.demographics.dateOfBirth, 'UTC')} />
            <Row label="Gender" value={intake.demographics?.gender} />
            <Row label="Occupation" value={intake.demographics?.occupation} />
            <Row label="City" value={intake.demographics?.city} />
            <div className="sm:col-span-2"><Row label="What brings them here" value={intake.presentingConcern} /></div>
            <Row label="Had therapy before" value={intake.history?.previousTherapy ? 'Yes' : 'No'} />
            <Row label="About previous therapy" value={intake.history?.previousTherapyDetails} />
            <Row label="Medications" value={intake.history?.medications} />
            <Row label="Medical conditions" value={intake.history?.medicalConditions} />
            <Row label="Emergency contact" value={intake.emergencyContact?.name && `${intake.emergencyContact.name}${intake.emergencyContact.relationship ? ` (${intake.emergencyContact.relationship})` : ''}, ${intake.emergencyContact.phone}`} />
            <Row label="Submitted" value={formatDateTime(intake.completedAt, tz)} />
          </dl>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Consent record</h2>
        {consents.length === 0 ? (
          <p className="mt-3 text-ink/70">No consent recorded yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {consents.map((c) => (
              <li key={c._id} className="rounded-xl bg-white p-4 text-sm ring-1 ring-mist">
                <p className="font-semibold">{c.title}</p>
                <p className="text-ink/70">Agreed {formatDateTime(c.acceptedAt, tz)} · wording version {c.version}{c.ipAddress ? ` · from IP ${c.ipAddress}` : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Packages</h2>
        {packages.length === 0 ? (
          <p className="mt-3 text-ink/70">No packages bought.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {packages.map((p) => (
              <li key={p._id} className="rounded-xl bg-white p-4 text-sm ring-1 ring-mist">
                <p className="font-semibold">{p.name}</p>
                <p className="text-ink/70">
                  {p.sessionsRemaining} of {p.sessionsTotal} sessions left · {formatINR(p.perSessionRate)} per session ·{' '}
                  {p.status === 'expired' ? 'expired on' : 'valid until'} {p.expiresAt ? formatDate(p.expiresAt, tz) : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Payments</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-ink/70">No payments yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {payments.map((p) => (
              <li key={p._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-4 text-sm ring-1 ring-mist">
                <div>
                  <p className="font-semibold">{p.description}</p>
                  <p className="text-ink/70">
                    {formatINR(p.amount)} · {formatDate(p.paidAt || p.createdAt, tz)} ·{' '}
                    {{ paid: 'Paid', created: 'Not completed', refunded: 'Refunded', failed: 'Failed' }[p.status]}
                  </p>
                </div>
                {p.invoiceNumber && (
                  <button type="button" className="font-medium text-tide underline"
                    onClick={() => downloadAuthedFile(`/payments/${p._id}/invoice`, `${p.invoiceNumber}.pdf`)}>
                    Invoice {p.invoiceNumber}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Session notes</h2>
        <p className="mt-3 text-ink/70">No notes yet.</p>
      </section>
    </main>
  );
}
