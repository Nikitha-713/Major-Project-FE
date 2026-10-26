import { useState } from 'react';
import Button from '../common/Button.jsx';
import { formatINR } from '../../utils/money.js';
import { downloadAuthedFile } from '../../utils/download.js';
import { detectTimezone, formatDate } from '../../utils/time.js';

const STATUS = {
  paid: { label: 'Paid', style: 'bg-tide/10 text-tide-dark' },
  created: { label: 'Not completed', style: 'bg-signal/30 text-ink' },
  refunded: { label: 'Refunded', style: 'bg-mist text-ink/70' },
  failed: { label: 'Failed', style: 'bg-danger/10 text-danger' },
};

export default function PaymentsTable({ payments }) {
  const [error, setError] = useState('');
  const tz = detectTimezone();

  const invoice = async (p) => {
    setError('');
    try {
      await downloadAuthedFile(`/payments/${p.id}/invoice`, `${p.invoiceNumber}.pdf`);
    } catch (err) {
      setError('Could not download the invoice. Please try again.');
    }
  };

  return (
    <div>
      {error && <p role="alert" className="mb-2 text-sm text-danger">{error}</p>}
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-mist">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-mist">
            <tr>
              {['Date', 'Client', 'For', 'Amount', 'Fee', 'You receive', 'Status', 'Invoice'].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const st = STATUS[p.status] || STATUS.failed;
              return (
                <tr key={p.id} className="border-b border-mist last:border-0">
                  <td className="px-4 py-3">{formatDate(p.paidAt || p.createdAt, tz)}</td>
                  <td className="px-4 py-3">{p.client ? p.client.name : '—'}</td>
                  <td className="px-4 py-3">{p.description}</td>
                  <td className="px-4 py-3">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3">{p.status === 'paid' ? formatINR(p.platformFee) : '—'}</td>
                  <td className="px-4 py-3">{p.status === 'paid' ? formatINR(p.netAmount) : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${st.style}`}>{st.label}</span>
                    {p.failureReason && p.status !== 'paid' && <div className="mt-1 text-xs text-ink/60">{p.failureReason}</div>}
                    {p.failureReason && p.status === 'paid' && <div className="mt-1 text-xs text-danger">{p.failureReason}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {p.invoiceNumber ? <Button variant="secondary" onClick={() => invoice(p)}>{p.invoiceNumber}</Button> : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
