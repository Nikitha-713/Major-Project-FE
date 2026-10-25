import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import { useAuth } from '../../context/AuthContext.jsx';
import AvailabilityEditor from '../../components/scheduling/AvailabilityEditor.jsx';
import Button from '../../components/common/Button.jsx';
import { detectTimezone, formatDateTime } from '../../utils/time.js';

export default function Schedule() {
  const { therapist } = useAuth();
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState('');
  const tz = detectTimezone();

  const loadSessions = useCallback(() => {
    axiosInstance
      .get('/scheduling/sessions')
      .then((res) => setSessions(res.data.sessions))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this session? The time will open up again for other clients.')) return;
    try {
      await axiosInstance.patch(`/scheduling/sessions/${id}/cancel`);
      loadSessions();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const bookingUrl = `${window.location.origin}/${therapist.slug}/book`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold">Schedule</h1>

      <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-mist">
        <p className="text-sm text-ink/60">Your booking page</p>
        <Link to={`/${therapist.slug}/book`} className="block truncate font-medium text-tide underline">{bookingUrl}</Link>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Upcoming sessions</h2>
        <p className="mt-1 text-xs text-ink/60">Times shown in your device timezone ({tz}).</p>
        {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
        {sessions === null ? (
          <p className="mt-3 text-ink/60">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="mt-3 text-ink/70">No upcoming sessions. Set your hours below, then share your booking page.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {sessions.map((s) => (
              <li key={s._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-mist">
                <div>
                  <p className="font-semibold">{formatDateTime(s.startTime, tz)}</p>
                  <p className="text-sm text-ink/70">{s.clientName} · {s.serviceTitle} · {s.durationMin} min</p>
                  <p className="text-xs text-ink/50">{s.clientEmail}{s.clientPhone ? ` · ${s.clientPhone}` : ''}</p>
                </div>
                <Button variant="secondary" onClick={() => cancel(s._id)}>Cancel session</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Availability</h2>
        <div className="mt-4"><AvailabilityEditor /></div>
      </section>
    </main>
  );
}
