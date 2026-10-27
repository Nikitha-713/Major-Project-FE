import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import IntakeForm from '../../components/crm/IntakeForm.jsx';
import Loader from '../../components/common/Loader.jsx';
import RichTextView from '../../components/notes/RichTextView.jsx';
import Button from '../../components/common/Button.jsx';
import { detectTimezone, formatDate, formatDateTime } from '../../utils/time.js';
import { formatINR } from '../../utils/money.js';
import { openCheckout } from '../../utils/razorpay.js';

export default function ClientPortal() {
  const { token } = useParams();
  const [portal, setPortal] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | invalid
  const [serverError, setServerError] = useState('');
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [busyPackage, setBusyPackage] = useState(null);
  const [notes, setNotes] = useState([]);
  const tz = detectTimezone();

  const load = useCallback(
    () =>
      axiosInstance
        .get(`/portal/${token}`)
        .then((res) => { setPortal(res.data); setStatus('ready'); })
        .catch(() => setStatus('invalid')),
    [token]
  );
  useEffect(() => { load(); }, [load]);

  // Notes your therapist chose to share. Private notes are never sent to this page by the server.
  useEffect(() => {
    axiosInstance.get(`/portal/${token}/notes`).then((res) => setNotes(res.data.notes)).catch(() => setNotes([]));
  }, [token]);

  const submit = async (payload) => {
    setServerError('');
    try {
      await axiosInstance.post(`/portal/${token}/intake`, payload);
      setPortal((p) => ({ ...p, intakeCompleted: true }));
      window.scrollTo({ top: 0 });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  const buyPackage = async (pkg) => {
    setNotice({ type: '', text: '' });
    setBusyPackage(pkg.id);
    try {
      const res = await axiosInstance.post(`/payments/portal/${token}/package-order`, { packageId: pkg.id });
      await openCheckout({
        payment: res.data.payment,
        businessName: portal.therapist.name,
        prefill: { name: portal.client.name },
        onSuccess: async (response) => {
          try {
            await axiosInstance.post('/payments/verify', response);
            await load();
            setNotice({ type: 'ok', text: 'Package purchased. Your invoice is listed below.' });
          } catch (err) {
            setNotice({ type: 'error', text: getErrorMessage(err) });
          }
        },
        onDismiss: () => setNotice({ type: 'error', text: 'The payment window was closed. You have not been charged.' }),
        onError: (msg) => setNotice({ type: 'error', text: msg }),
      });
    } catch (err) {
      setNotice({ type: 'error', text: err.response ? getErrorMessage(err) : err.message });
    } finally {
      setBusyPackage(null);
    }
  };

  if (status === 'loading') return <Loader label="Loading" />;
  if (status === 'invalid') {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">This link is not valid</h1>
        <p className="mt-3 text-ink/70">Ask your therapist to send you a fresh link.</p>
      </main>
    );
  }

  const first = portal.client.name.split(' ')[0];
  const invoiceUrl = (id) => `${axiosInstance.defaults.baseURL}/payments/portal/${token}/invoices/${id}`;
  const usable = portal.packages.filter((p) => p.status === 'active' && p.sessionsRemaining > 0);

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-6 py-12">
      <div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">Hello {first}</h1>
        <p className="mt-2 text-ink/70">Your space with {portal.therapist.name}.</p>
      </div>

      <section className="rounded-xl bg-white p-5 ring-1 ring-mist">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Your upcoming sessions</h2>
          <Link to={`/${portal.therapist.slug}/book?portal=${token}`}
            className="rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-white hover:bg-tide-dark">Book a session</Link>
        </div>
        {portal.upcomingSessions.length === 0 ? (
          <p className="mt-3 text-sm text-ink/70">Nothing booked yet.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {portal.upcomingSessions.map((s) => (
              <li key={s._id}>{formatDateTime(s.startTime, tz)} · {s.serviceTitle} ({s.durationMin} min)</li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink/60">Times shown in {tz}</p>
      </section>

      {notes.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">Notes from {portal.therapist.name}</h2>
          <ul className="mt-3 space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl bg-white p-5 ring-1 ring-mist">
                <h3 className="font-display text-lg font-bold">{n.title || 'A note for you'}</h3>
                <p className="text-xs text-ink/60">
                  Shared {formatDate(n.sharedAt, tz)}{n.sessionDate ? ` · session on ${formatDate(n.sessionDate, tz)}` : ''}
                </p>
                <div className="mt-3 space-y-3">
                  {n.sections.map((s) => (
                    <div key={s.key}>
                      {n.sections.length > 1 && <h4 className="text-xs font-semibold uppercase tracking-wide text-ink/60">{s.label}</h4>}
                      <RichTextView doc={s.content} />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {portal.intakeCompleted ? (
        <section className="rounded-xl bg-white p-6 ring-1 ring-mist" role="status">
          <h2 className="font-display text-xl font-bold text-tide">Your intake form is complete</h2>
          <p className="mt-2 text-ink/80">Thank you. {portal.therapist.name} will read it before your first session. If you need to change anything, tell them directly.</p>
        </section>
      ) : (
        <section>
          <h2 className="font-display text-2xl font-bold">Before your first session</h2>
          <p className="mb-8 mt-1 text-ink/70">This takes about five minutes. Only {portal.therapist.name} can see your answers.</p>
          <IntakeForm consent={portal.consent} onSubmit={submit} serverError={serverError} />
        </section>
      )}

      {notice.text && (
        <p role={notice.type === 'error' ? 'alert' : 'status'} className={`rounded-lg bg-white p-3 text-sm ring-1 ${notice.type === 'error' ? 'text-danger ring-danger/30' : 'text-tide ring-tide/30'}`}>
          {notice.text}
        </p>
      )}

      {(portal.packages.length > 0 || portal.packagesForSale.length > 0) && (
        <section>
          <h2 className="font-display text-xl font-bold">Packages</h2>
          {portal.packages.length > 0 && (
            <ul className="mt-3 space-y-2">
              {portal.packages.map((p) => (
                <li key={p.id} className="rounded-xl bg-white p-4 text-sm ring-1 ring-mist">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-ink/70">
                    {p.sessionsRemaining} of {p.sessionsTotal} sessions left ({p.durationMin} min each) · {formatINR(p.perSessionRate)} per session ·{' '}
                    {p.status === 'expired' ? 'expired on' : 'use before'} {p.expiresAt ? formatDate(p.expiresAt, tz) : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {usable.length > 0 && <p className="mt-2 text-xs text-ink/60">Choose "Book a session" above and your credit is applied automatically.</p>}

          {portal.packagesForSale.length > 0 && (
            <div className="mt-5">
              <h3 className="font-semibold">Buy a package</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {portal.packagesForSale.map((p) => (
                  <div key={p.id} className="flex flex-col rounded-xl bg-white p-4 ring-1 ring-mist">
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-1 flex-1 text-sm text-ink/70">
                      {p.sessions} sessions of {p.durationMin} min · {formatINR(p.perSessionRate)} each · valid {p.validityDays} days
                    </p>
                    <p className="mt-3 font-display text-xl font-bold text-tide">{formatINR(p.price)}</p>
                    <Button className="mt-3" onClick={() => buyPackage(p)} disabled={busyPackage === p.id}>
                      {busyPackage === p.id ? 'Opening…' : 'Buy now'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {portal.payments.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">Payments and invoices</h2>
          <ul className="mt-3 space-y-2">
            {portal.payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-4 text-sm ring-1 ring-mist">
                <div>
                  <p className="font-semibold">{p.description}</p>
                  <p className="text-ink/70">{formatINR(p.amount)} · {formatDate(p.paidAt, tz)}</p>
                </div>
                {p.invoiceNumber && (
                  <a href={invoiceUrl(p.id)} target="_blank" rel="noreferrer" className="font-medium text-tide underline">
                    Invoice {p.invoiceNumber}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
