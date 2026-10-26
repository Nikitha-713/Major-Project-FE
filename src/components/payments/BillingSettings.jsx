import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import Button from '../common/Button.jsx';

const field = 'mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm';

export default function BillingSettings() {
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    axiosInstance.get('/payments/billing').then((res) => {
      setInfo(res.data);
      reset(res.data.billing);
    });
  }, [reset]);

  const onSubmit = async (values) => {
    setMessage({ type: '', text: '' });
    try {
      const res = await axiosInstance.put('/payments/billing', {
        collectAdvancePayment: values.collectAdvancePayment,
        businessName: values.businessName,
        address: values.address,
        gstin: values.gstin,
        gstRatePercent: Number(values.gstRatePercent || 0),
      });
      setInfo(res.data);
      reset(res.data.billing);
      setMessage({ type: 'ok', text: 'Billing settings saved' });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    }
  };

  if (!info) return <p className="text-ink/60">Loading…</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-xl bg-white p-5 ring-1 ring-mist">
      {!info.paymentsConfigured && (
        <p role="alert" className="rounded-lg bg-signal/30 p-3 text-sm">
          Online payments are not set up on the server yet. Add your Razorpay test keys to the backend .env file, then restart the server.
        </p>
      )}

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1" {...register('collectAdvancePayment')} />
        <span>
          <span className="font-medium">Collect payment when clients book</span>
          <span className="block text-ink/60">Applies to sessions that have a price on your profile. The time is held for a few minutes while the client pays.</span>
        </span>
      </label>
      <p className="text-xs text-ink/60">A platform fee of {info.platformFeePercent}% is deducted from each online payment. You receive the rest.</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium">Name on invoices</label>
          <input id="businessName" maxLength={100} className={field} {...register('businessName')} />
        </div>
        <div>
          <label htmlFor="gstin" className="block text-sm font-medium">GSTIN (optional)</label>
          <input id="gstin" maxLength={15} className={field} {...register('gstin')} />
          {errors.gstin && <p className="mt-1 text-sm text-danger">{errors.gstin.message}</p>}
        </div>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium">Address on invoices</label>
        <textarea id="address" rows={2} maxLength={300} className={field} {...register('address')} />
      </div>
      <div className="max-w-xs">
        <label htmlFor="gstRatePercent" className="block text-sm font-medium">GST rate (%)</label>
        <input id="gstRatePercent" type="number" min="0" max={info.gstRateMax} step="0.5" className={field} {...register('gstRatePercent')} />
        <p className="mt-1 text-xs text-ink/60">Only used when a GSTIN is entered. Your prices are treated as GST-inclusive. Ask your accountant which rate applies to you.</p>
      </div>

      {message.text && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`text-sm ${message.type === 'error' ? 'text-danger' : 'text-tide'}`}>{message.text}</p>
      )}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save billing settings'}</Button>
    </form>
  );
}
