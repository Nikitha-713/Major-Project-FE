import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import Button from '../common/Button.jsx';
import { formatINR, rupeesToPaise } from '../../utils/money.js';

const field = 'mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm';

export default function PackageManager() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { sessions: 3, durationMin: 60, validityDays: 90 },
  });

  const load = () =>
    axiosInstance.get('/payments/packages').then((res) => setData(res.data)).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => { load(); }, []);

  const create = async (v) => {
    setError('');
    try {
      await axiosInstance.post('/payments/packages', {
        name: v.name,
        sessions: Number(v.sessions),
        durationMin: Number(v.durationMin),
        validityDays: Number(v.validityDays),
        price: rupeesToPaise(v.priceInr),
      });
      reset({ name: '', priceInr: '', sessions: 3, durationMin: 60, validityDays: 90 });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggle = async (pkg) => {
    try {
      await axiosInstance.patch(`/payments/packages/${pkg._id}`, { active: !pkg.active });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!data) return <p className="text-ink/60">Loading…</p>;

  return (
    <div className="space-y-5">
      {data.packages.length === 0 ? (
        <p className="text-ink/70">No packages yet. Packages let clients pay for several sessions at once.</p>
      ) : (
        <ul className="space-y-2">
          {data.packages.map((p) => (
            <li key={p._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-mist">
              <div>
                <p className="font-semibold">{p.name} {!p.active && <span className="ml-2 rounded-full bg-mist px-2 py-0.5 text-xs font-normal">Off</span>}</p>
                <p className="text-sm text-ink/70">
                  {p.sessions} sessions of {p.durationMin} min · {formatINR(p.price)} ({formatINR(Math.round(p.price / p.sessions))} each) · valid {p.validityDays} days
                </p>
              </div>
              <Button variant="secondary" onClick={() => toggle(p)}>{p.active ? 'Turn off' : 'Turn on'}</Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit(create)} noValidate className="grid gap-4 rounded-xl bg-white p-5 ring-1 ring-mist sm:grid-cols-6">
        <div className="sm:col-span-6">
          <h3 className="font-semibold">Add a package</h3>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="pkgName" className="block text-sm font-medium">Name</label>
          <input id="pkgName" className={field} placeholder="6 session pack" {...register('name', { required: 'Give the package a name' })} />
          {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="pkgSessions" className="block text-sm font-medium">Sessions</label>
          <select id="pkgSessions" className={field} {...register('sessions')}>
            {data.options.sessions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pkgDuration" className="block text-sm font-medium">Length</label>
          <select id="pkgDuration" className={field} {...register('durationMin')}>
            {data.options.durations.map((n) => <option key={n} value={n}>{n} min</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="pkgValidity" className="block text-sm font-medium">Valid (days)</label>
          <input id="pkgValidity" type="number" min={data.options.validityDays.min} max={data.options.validityDays.max} className={field}
            {...register('validityDays', { required: 'Required' })} />
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="pkgPrice" className="block text-sm font-medium">Total price (INR)</label>
          <input id="pkgPrice" type="number" min="1" step="1" className={field}
            {...register('priceInr', { required: 'Enter the total price', min: { value: 1, message: 'Price must be at least 1' } })} />
          {errors.priceInr && <p className="mt-1 text-sm text-danger">{errors.priceInr.message}</p>}
        </div>
        <div className="flex items-end sm:col-span-3">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding…' : 'Add package'}</Button>
        </div>
        {error && <p role="alert" className="text-sm text-danger sm:col-span-6">{error}</p>}
      </form>
    </div>
  );
}
