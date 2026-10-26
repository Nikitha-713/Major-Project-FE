import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import IntakeForm from '../../components/crm/IntakeForm.jsx';
import Loader from '../../components/common/Loader.jsx';
import { detectTimezone, formatDateTime } from '../../utils/time.js';

export default function ClientPortal() {
  const { token } = useParams();
  const [portal, setPortal] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | invalid
  const [serverError, setServerError] = useState('');
  const tz = detectTimezone();

  useEffect(() => {
    axiosInstance
      .get(`/portal/${token}`)
      .then((res) => { setPortal(res.data); setStatus('ready'); })
      .catch(() => setStatus('invalid'));
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

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold md:text-4xl">Hello {first}</h1>
      <p className="mt-2 text-ink/70">Your space with {portal.therapist.name}.</p>

      {portal.upcomingSessions.length > 0 && (
        <section className="mt-8 rounded-xl bg-white p-5 ring-1 ring-mist">
          <h2 className="font-display text-lg font-bold">Your upcoming sessions</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {portal.upcomingSessions.map((s) => (
              <li key={s._id}>{formatDateTime(s.startTime, tz)} · {s.serviceTitle} ({s.durationMin} min)</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink/60">Times shown in {tz}</p>
        </section>
      )}

      {portal.intakeCompleted ? (
        <section className="mt-8 rounded-xl bg-white p-6 ring-1 ring-mist" role="status">
          <h2 className="font-display text-xl font-bold text-tide">Your intake form is complete</h2>
          <p className="mt-2 text-ink/80">Thank you. {portal.therapist.name} will read it before your first session. If you need to change anything, tell them directly.</p>
        </section>
      ) : (
        <section className="mt-8">
          <h2 className="font-display text-2xl font-bold">Before your first session</h2>
          <p className="mt-1 mb-8 text-ink/70">This takes about five minutes. Only {portal.therapist.name} can see your answers.</p>
          <IntakeForm consent={portal.consent} onSubmit={submit} serverError={serverError} />
        </section>
      )}
    </main>
  );
}
