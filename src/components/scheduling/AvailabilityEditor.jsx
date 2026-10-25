import { useEffect, useState } from 'react';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import Button from '../common/Button.jsx';
import Loader from '../common/Loader.jsx';
import { timezoneList, todayKey } from '../../utils/time.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // show Monday first
const DEFAULT_WINDOW = { start: '09:00', end: '17:00' };
const field = 'rounded-lg border border-mist bg-white px-3 py-2 text-sm';

function toForm(av) {
  return {
    timezone: av.timezone,
    days: Array.from({ length: 7 }, (_, dow) => {
      const found = av.weeklyHours.find((d) => d.dayOfWeek === dow);
      return { open: Boolean(found && found.windows.length), windows: found ? found.windows.map((w) => ({ start: w.start, end: w.end })) : [] };
    }),
    bufferMin: av.bufferMin,
    sessionDurations: av.sessionDurations,
    slotStepMin: av.slotStepMin,
    minNoticeHours: av.minNoticeHours,
    maxAdvanceDays: av.maxAdvanceDays,
    overrides: av.overrides.map((o) => ({
      date: o.date, closed: o.windows.length === 0, start: o.windows[0]?.start || '10:00', end: o.windows[0]?.end || '14:00', note: o.note || '',
    })),
    blockedSlots: av.blockedSlots.map((b) => ({ date: b.date, start: b.start, end: b.end, reason: b.reason || '' })),
  };
}

function toPayload(f) {
  return {
    timezone: f.timezone,
    weeklyHours: f.days.map((d, dow) => ({ dayOfWeek: dow, windows: d.open ? d.windows : [] })).filter((d) => d.windows.length > 0),
    bufferMin: Number(f.bufferMin),
    sessionDurations: f.sessionDurations,
    slotStepMin: Number(f.slotStepMin),
    minNoticeHours: Number(f.minNoticeHours),
    maxAdvanceDays: Number(f.maxAdvanceDays),
    overrides: f.overrides.map((o) => ({
      date: o.date, windows: o.closed ? [] : [{ start: o.start, end: o.end }], note: o.note,
    })),
    blockedSlots: f.blockedSlots,
  };
}

export default function AvailabilityEditor() {
  const [form, setForm] = useState(null);
  const [options, setOptions] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosInstance
      .get('/scheduling/availability')
      .then((res) => {
        setForm(toForm(res.data.availability));
        setOptions(res.data.options);
      })
      .catch((err) => setMessage({ type: 'error', text: getErrorMessage(err) }));
  }, []);

  if (!form || !options) return message.text ? <p role="alert" className="text-danger">{message.text}</p> : <Loader label="Loading availability" />;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setDay = (dow, fn) => setForm((f) => ({ ...f, days: f.days.map((d, i) => (i === dow ? fn(d) : d)) }));
  const setList = (key, index, patch) =>
    setForm((f) => ({ ...f, [key]: f[key].map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  const removeFrom = (key, index) => setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));

  const toggleDuration = (d) =>
    set('sessionDurations', form.sessionDurations.includes(d) ? form.sessionDurations.filter((x) => x !== d) : [...form.sessionDurations, d]);

  const save = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await axiosInstance.put('/scheduling/availability', toPayload(form));
      setForm(toForm(res.data.availability));
      setMessage({ type: 'ok', text: 'Availability saved. Clients can now book these times.' });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-xl font-bold">Weekly hours</h2>
        <div className="mt-3">
          <label htmlFor="tz" className="block text-sm font-medium">Your timezone</label>
          <select id="tz" className={`${field} mt-1 w-full max-w-sm`} value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
            {timezoneList().map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
          <p className="mt-1 text-xs text-ink/60">Hours below are in this timezone. Clients see them converted to their own.</p>
        </div>

        <div className="mt-4 rounded-xl bg-white px-4 ring-1 ring-mist">
          {DAY_ORDER.map((dow) => {
            const day = form.days[dow];
            return (
              <div key={dow} className="flex flex-wrap items-start gap-4 border-b border-mist py-3 last:border-0">
                <label className="flex w-36 items-center gap-2 pt-2 font-medium">
                  <input
                    type="checkbox"
                    checked={day.open}
                    onChange={(e) => setDay(dow, (d) => ({ open: e.target.checked, windows: e.target.checked && d.windows.length === 0 ? [{ ...DEFAULT_WINDOW }] : d.windows }))}
                  />
                  {DAY_NAMES[dow]}
                </label>
                {day.open ? (
                  <div className="space-y-2">
                    {day.windows.map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="time" aria-label={`${DAY_NAMES[dow]} start`} className={field} value={w.start}
                          onChange={(e) => setDay(dow, (d) => ({ ...d, windows: d.windows.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)) }))} />
                        <span>to</span>
                        <input type="time" aria-label={`${DAY_NAMES[dow]} end`} className={field} value={w.end}
                          onChange={(e) => setDay(dow, (d) => ({ ...d, windows: d.windows.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)) }))} />
                        {day.windows.length > 1 && (
                          <button type="button" className="text-sm text-danger underline"
                            onClick={() => setDay(dow, (d) => ({ ...d, windows: d.windows.filter((_, j) => j !== i) }))}>Remove</button>
                        )}
                      </div>
                    ))}
                    {day.windows.length < options.maxWindowsPerDay && (
                      <button type="button" className="text-sm font-medium text-tide underline"
                        onClick={() => setDay(dow, (d) => ({ ...d, windows: [...d.windows, { start: '14:00', end: '18:00' }] }))}>Add hours</button>
                    )}
                  </div>
                ) : (
                  <span className="pt-2 text-sm text-ink/50">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Session rules</h2>
        <div className="mt-3 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Session lengths</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {options.sessionDurations.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.sessionDurations.includes(d)} onChange={() => toggleDuration(d)} /> {d} min
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-ink/60">Used when you have not listed sessions on your profile.</p>
          </div>
          <div>
            <label htmlFor="buffer" className="block text-sm font-medium">Break after each session</label>
            <select id="buffer" className={`${field} mt-1 w-full`} value={form.bufferMin} onChange={(e) => set('bufferMin', Number(e.target.value))}>
              {options.bufferMin.map((m) => <option key={m} value={m}>{m === 0 ? 'No break' : `${m} minutes`}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="step" className="block text-sm font-medium">Offer start times every</label>
            <select id="step" className={`${field} mt-1 w-full`} value={form.slotStepMin} onChange={(e) => set('slotStepMin', Number(e.target.value))}>
              {options.slotStepMin.map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="notice" className="block text-sm font-medium">Minimum notice (hours)</label>
              <input id="notice" type="number" min="0" max={options.maxMinNoticeHours} className={`${field} mt-1 w-full`}
                value={form.minNoticeHours} onChange={(e) => set('minNoticeHours', e.target.value)} />
            </div>
            <div>
              <label htmlFor="advance" className="block text-sm font-medium">Book up to (days ahead)</label>
              <input id="advance" type="number" min="1" max={options.maxAdvanceDays} className={`${field} mt-1 w-full`}
                value={form.maxAdvanceDays} onChange={(e) => set('maxAdvanceDays', e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Days off and special hours</h2>
        <div className="mt-3 space-y-3">
          {form.overrides.map((o, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-3 ring-1 ring-mist">
              <div>
                <label className="block text-xs font-medium">Date</label>
                <input type="date" min={todayKey()} className={field} value={o.date} onChange={(e) => setList('overrides', i, { date: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium">Type</label>
                <select className={field} value={o.closed ? 'closed' : 'special'} onChange={(e) => setList('overrides', i, { closed: e.target.value === 'closed' })}>
                  <option value="closed">Closed all day</option>
                  <option value="special">Special hours</option>
                </select>
              </div>
              {!o.closed && (
                <div className="flex items-center gap-2">
                  <input type="time" aria-label="Special hours start" className={field} value={o.start} onChange={(e) => setList('overrides', i, { start: e.target.value })} />
                  <span>to</span>
                  <input type="time" aria-label="Special hours end" className={field} value={o.end} onChange={(e) => setList('overrides', i, { end: e.target.value })} />
                </div>
              )}
              <div className="min-w-32 flex-1">
                <label className="block text-xs font-medium">Note</label>
                <input className={`${field} w-full`} maxLength={100} value={o.note} onChange={(e) => setList('overrides', i, { note: e.target.value })} />
              </div>
              <button type="button" className="pb-2 text-sm text-danger underline" onClick={() => removeFrom('overrides', i)}>Remove</button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" className="mt-3"
          onClick={() => set('overrides', [...form.overrides, { date: todayKey(), closed: true, start: '10:00', end: '14:00', note: '' }])}>
          Add a day
        </Button>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Blocked times</h2>
        <p className="mt-1 text-sm text-ink/60">Remove part of an open day, for example a lunch break or an appointment.</p>
        <div className="mt-3 space-y-3">
          {form.blockedSlots.map((b, i) => (
            <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-3 ring-1 ring-mist">
              <div>
                <label className="block text-xs font-medium">Date</label>
                <input type="date" min={todayKey()} className={field} value={b.date} onChange={(e) => setList('blockedSlots', i, { date: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="time" aria-label="Blocked start" className={field} value={b.start} onChange={(e) => setList('blockedSlots', i, { start: e.target.value })} />
                <span>to</span>
                <input type="time" aria-label="Blocked end" className={field} value={b.end} onChange={(e) => setList('blockedSlots', i, { end: e.target.value })} />
              </div>
              <div className="min-w-32 flex-1">
                <label className="block text-xs font-medium">Reason</label>
                <input className={`${field} w-full`} maxLength={100} value={b.reason} onChange={(e) => setList('blockedSlots', i, { reason: e.target.value })} />
              </div>
              <button type="button" className="pb-2 text-sm text-danger underline" onClick={() => removeFrom('blockedSlots', i)}>Remove</button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" className="mt-3"
          onClick={() => set('blockedSlots', [...form.blockedSlots, { date: todayKey(), start: '13:00', end: '14:00', reason: '' }])}>
          Block a time
        </Button>
      </section>

      {message.text && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`text-sm ${message.type === 'error' ? 'text-danger' : 'text-tide'}`}>{message.text}</p>
      )}
      <Button type="button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save availability'}</Button>
    </div>
  );
}
