import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import Calendar from '../../components/scheduling/Calendar.jsx';
import SlotPicker from '../../components/scheduling/SlotPicker.jsx';
import Loader from '../../components/common/Loader.jsx';
import Button from '../../components/common/Button.jsx';
import { dateKeyInZone, detectTimezone, formatLongDate, formatTime, timezoneList } from '../../utils/time.js';
import { formatINR, rupeesToPaise } from '../../utils/money.js';
import { openCheckout } from '../../utils/razorpay.js';

const inputClass = 'mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2';

export default function BookingPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const portalToken = searchParams.get('portal') || undefined; // present when the client came from their personal page

  const [therapist, setTherapist] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing
  const [serviceId, setServiceId] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [slotData, setSlotData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [tz, setTz] = useState(detectTimezone());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [portal, setPortal] = useState(null);
  const [pending, setPending] = useState(null); // booking held while the client pays
  const [payMessage, setPayMessage] = useState('');
  const [booked, setBooked] = useState(null);
  const [paidOnline, setPaidOnline] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    axiosInstance
      .get(`/therapists/public/${slug}`)
      .then((res) => {
        const t = res.data.therapist;
        setTherapist(t);
        if (t.services.length) {
          setServiceId(t.services[0].id);
          setDurationMin(t.services[0].durationMin);
        }
        setStatus('ready');
      })
      .catch(() => setStatus('missing'));
  }, [slug]);

  // A personal link unlocks package credits and pre-fills nothing sensitive.
  useEffect(() => {
    if (!portalToken) return;
    axiosInstance.get(`/portal/${portalToken}`).then((res) => setPortal(res.data)).catch(() => setPortal(null));
  }, [portalToken]);

  useEffect(() => {
    if (!therapist) return undefined;
    let cancelled = false;
    setLoadingSlots(true);
    axiosInstance
      .get(`/scheduling/public/${slug}/slots`, { params: durationMin ? { durationMin } : {} })
      .then((res) => { if (!cancelled) setSlotData(res.data); })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [slug, therapist, durationMin, refreshKey]);

  const slotsByDate = useMemo(() => {
    const map = new Map();
    (slotData?.slots || []).forEach((iso) => {
      const key = dateKeyInZone(iso, tz);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(iso);
    });
    return map;
  }, [slotData, tz]);

  const availableDates = useMemo(() => [...slotsByDate.keys()].sort(), [slotsByDate]);

  useEffect(() => {
    if (availableDates.length === 0) setSelectedDate(null);
    else if (!selectedDate || !slotsByDate.has(selectedDate)) setSelectedDate(availableDates[0]);
  }, [availableDates]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedService = therapist?.services.find((s) => s.id === serviceId);
  const activeDuration = selectedService ? selectedService.durationMin : durationMin ?? slotData?.durationMin;

  // Money: does this booking cost anything, and can a package credit cover it?
  const pricePaise = selectedService && typeof selectedService.price === 'number' ? rupeesToPaise(selectedService.price) : 0;
  const credit = portal?.packages?.find((p) => p.status === 'active' && p.sessionsRemaining > 0 && p.durationMin === activeDuration);
  const payRequired = Boolean(slotData?.paymentRequired) && pricePaise > 0 && !credit;

  const chooseService = (service) => {
    setServiceId(service.id);
    setDurationMin(service.durationMin);
    setSelectedSlot(null);
    setError('');
  };

  const startCheckout = async (p) => {
    setPayMessage('');
    try {
      await openCheckout({
        payment: p.payment,
        businessName: therapist.name,
        prefill: p.prefill,
        onSuccess: async (response) => {
          try {
            await axiosInstance.post('/payments/verify', response);
            setPaidOnline(true);
            setBooked(p.session);
            setPending(null);
          } catch (err) {
            setError(getErrorMessage(err));
            setPending(null);
            setSelectedSlot(null);
            setRefreshKey((k) => k + 1);
          }
        },
        onDismiss: () => setPayMessage('The payment window was closed. Your time is still held for a few minutes, so you can try again.'),
        onError: (msg) => setPayMessage(msg),
      });
    } catch (err) {
      setPayMessage(err.message);
    }
  };

  const onSubmit = async ({ clientName, clientEmail, clientPhone }) => {
    setError('');
    try {
      const res = await axiosInstance.post(`/scheduling/public/${slug}/book`, {
        startTime: selectedSlot,
        serviceId: selectedService ? selectedService.id : undefined,
        durationMin: selectedService ? undefined : activeDuration,
        clientName, clientEmail, clientPhone, clientTimezone: tz,
        portalToken,
      });
      if (res.data.requiresPayment) {
        const p = { session: res.data.session, payment: res.data.payment, prefill: { name: clientName, email: clientEmail, contact: clientPhone } };
        setPending(p);
        startCheckout(p);
      } else {
        setBooked(res.data.session);
      }
    } catch (err) {
      setError(getErrorMessage(err));
      if (err.response?.status === 409) {
        setSelectedSlot(null);
        setRefreshKey((k) => k + 1);
      }
    }
  };

  if (status === 'loading') return <Loader label="Loading" />;
  if (status === 'missing') {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">We could not find that page</h1>
        <p className="mt-3 text-ink/70">Check the link you were given.</p>
      </main>
    );
  }

  if (booked) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <div className="rounded-xl bg-white p-8 ring-1 ring-mist" role="status">
          <h1 className="font-display text-3xl font-bold text-tide">You are booked</h1>
          <p className="mt-4 text-lg">{booked.serviceTitle} with {booked.therapistName}</p>
          <p className="mt-1 font-semibold">{formatLongDate(dateKeyInZone(booked.startTime, tz))}, {formatTime(booked.startTime, tz)}</p>
          <p className="mt-1 text-sm text-ink/60">{booked.durationMin} minutes · times shown in {tz}</p>
          {paidOnline && <p className="mt-3 text-sm text-tide">Payment received. Your invoice is on your personal page.</p>}
          {booked.paidWithPackage && <p className="mt-3 text-sm text-tide">One credit from your package was used.</p>}
          {booked.portalToken && (
            <div className="mt-6 rounded-lg bg-fog p-4">
              <p className="font-semibold">One more step before your first session</p>
              <p className="mt-1 text-sm text-ink/70">
                Please complete a short intake form and consent. Save the link to this page: it is also your personal page for invoices and packages.
              </p>
              <Link to={`/portal/${booked.portalToken}`}
                className="mt-3 inline-block rounded-lg bg-tide px-4 py-2 text-sm font-semibold text-white hover:bg-tide-dark">
                Open my personal page
              </Link>
            </div>
          )}
          <Link to={`/${slug}`} className="mt-6 inline-block font-medium text-tide underline">Back to {booked.therapistName}'s page</Link>
        </div>
      </main>
    );
  }

  if (pending) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <div className="rounded-xl bg-white p-8 ring-1 ring-mist">
          <h1 className="font-display text-3xl font-bold">Complete your payment</h1>
          <p className="mt-3">
            {pending.session.serviceTitle} with {pending.session.therapistName}<br />
            <span className="font-semibold">{formatLongDate(dateKeyInZone(pending.session.startTime, tz))}, {formatTime(pending.session.startTime, tz)}</span>
          </p>
          <p className="mt-3 text-sm text-ink/70">We are holding this time for you for about {pending.payment.holdMinutes} minutes.</p>
          {payMessage && <p role="alert" className="mt-4 text-sm text-danger">{payMessage}</p>}
          <Button className="mt-6" onClick={() => startCheckout(pending)}>Pay {formatINR(pending.payment.amount)}</Button>
        </div>
      </main>
    );
  }

  const daySlots = selectedDate ? slotsByDate.get(selectedDate) || [] : [];
  const noAvailability = !loadingSlots && slotData && slotData.slots.length === 0;
  const submitLabel = isSubmitting
    ? 'Booking…'
    : payRequired ? `Continue to pay ${formatINR(pricePaise)}` : credit ? 'Confirm using package credit' : 'Confirm booking';

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link to={`/${slug}`} className="text-sm text-tide underline">← {therapist.name}</Link>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">Book a session with {therapist.name}</h1>

      {therapist.services.length > 0 && (
        <section className="mt-8" aria-labelledby="choose-session">
          <h2 id="choose-session" className="font-display text-xl font-bold">Choose a session</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {therapist.services.map((s) => (
              <button key={s.id} type="button" onClick={() => chooseService(s)} aria-pressed={s.id === serviceId}
                className={`rounded-xl p-4 text-left ring-1 transition-colors ${s.id === serviceId ? 'bg-tide text-white ring-tide' : 'bg-white ring-mist hover:ring-tide'}`}>
                <span className="block font-semibold">{s.title}</span>
                <span className={`text-sm ${s.id === serviceId ? 'text-white/80' : 'text-ink/60'}`}>
                  {s.durationMin} minutes{typeof s.price === 'number' ? ` · ${formatINR(rupeesToPaise(s.price))}` : ''}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {therapist.services.length === 0 && slotData && slotData.sessionDurations.length > 1 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Session length</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {slotData.sessionDurations.map((d) => (
              <button key={d} type="button" aria-pressed={d === activeDuration}
                onClick={() => { setDurationMin(d); setSelectedSlot(null); }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${d === activeDuration ? 'border-tide bg-tide text-white' : 'border-mist bg-white hover:border-tide'}`}>
                {d} minutes
              </button>
            ))}
          </div>
        </section>
      )}

      {credit && (
        <p className="mt-6 rounded-lg bg-white p-3 text-sm ring-1 ring-tide/40">
          This session will use one credit from your package <strong>{credit.name}</strong> ({credit.sessionsRemaining} left). No payment needed.
        </p>
      )}

      <section className="mt-10" aria-labelledby="pick-time">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="pick-time" className="font-display text-xl font-bold">Pick a day and time</h2>
          <div>
            <label htmlFor="tz" className="block text-xs font-medium">Times shown in</label>
            <select id="tz" value={tz} onChange={(e) => { setTz(e.target.value); setSelectedSlot(null); }}
              className="mt-1 max-w-[16rem] rounded-lg border border-mist bg-white px-3 py-2 text-sm">
              {timezoneList().map((z) => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        {loadingSlots && !slotData ? (
          <Loader label="Finding open times" />
        ) : noAvailability ? (
          <p className="mt-6 rounded-xl bg-white p-6 ring-1 ring-mist">{therapist.name} has no open times right now. Please check back soon.</p>
        ) : (
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_1fr]">
            <Calendar availableDates={availableDates} selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }} />
            <div>
              {selectedDate && <h3 className="mb-3 font-semibold">{formatLongDate(selectedDate)}</h3>}
              <SlotPicker slots={daySlots} timezone={tz} selected={selectedSlot} onSelect={setSelectedSlot} />
            </div>
          </div>
        )}
      </section>

      {error && <p role="alert" className="mt-6 rounded-lg bg-white p-3 text-sm text-danger ring-1 ring-danger/30">{error}</p>}

      {selectedSlot && (
        <section className="mt-10" aria-labelledby="your-details">
          <h2 id="your-details" className="font-display text-xl font-bold">Your details</h2>
          <p className="mt-1 text-sm text-ink/70">
            {formatLongDate(dateKeyInZone(selectedSlot, tz))}, {formatTime(selectedSlot, tz)} ({activeDuration} minutes)
          </p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 max-w-md space-y-5">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium">Full name</label>
              <input id="clientName" autoComplete="name" className={inputClass}
                {...register('clientName', { required: 'Enter your name', minLength: { value: 2, message: 'Name is too short' } })} />
              {errors.clientName && <p className="mt-1 text-sm text-danger">{errors.clientName.message}</p>}
            </div>
            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium">Email</label>
              <input id="clientEmail" type="email" autoComplete="email" className={inputClass}
                {...register('clientEmail', { required: 'Enter your email address', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} />
              {errors.clientEmail && <p className="mt-1 text-sm text-danger">{errors.clientEmail.message}</p>}
            </div>
            <div>
              <label htmlFor="clientPhone" className="block text-sm font-medium">Phone (optional)</label>
              <input id="clientPhone" type="tel" autoComplete="tel" maxLength={20} className={inputClass} {...register('clientPhone')} />
            </div>
            <Button type="submit" disabled={isSubmitting}>{submitLabel}</Button>
          </form>
        </section>
      )}
    </main>
  );
}
