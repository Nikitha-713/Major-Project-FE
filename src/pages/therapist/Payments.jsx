import { useEffect, useState } from 'react';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import PaymentsTable from '../../components/payments/PaymentsTable.jsx';
import PackageManager from '../../components/payments/PackageManager.jsx';
import BillingSettings from '../../components/payments/BillingSettings.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import { formatINR } from '../../utils/money.js';

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-mist">
      <p className="text-xs font-medium text-ink/60">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function Payments() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get('/payments', { params: { page, status: status || undefined } })
      .then((res) => { if (!cancelled) { setData(res.data); setError(''); } })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)); });
    return () => { cancelled = true; };
  }, [page, status]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-6 py-12">
      <h1 className="font-display text-3xl font-bold">Payments</h1>

      {error && <p role="alert" className="text-danger">{error}</p>}
      {!data ? (
        <Loader label="Loading payments" />
      ) : (
        <section>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Collected" value={formatINR(data.summary.collected)} />
            <StatCard label="Platform fees" value={formatINR(data.summary.platformFees)} />
            <StatCard label="You receive" value={formatINR(data.summary.netPayout)} />
            <StatCard label="Awaiting payment" value={data.summary.awaitingCount} />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">History</h2>
            <div>
              <label htmlFor="payStatus" className="sr-only">Filter by status</label>
              <select id="payStatus" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="rounded-lg border border-mist bg-white px-3 py-2 text-sm">
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="created">Not completed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="mt-3">
            {data.payments.length === 0 ? (
              <p className="rounded-xl bg-white p-6 ring-1 ring-mist">No payments yet. They appear here when clients pay for a session or buy a package.</p>
            ) : (
              <>
                <PaymentsTable payments={data.payments} />
                <div className="mt-4 flex items-center justify-end gap-3 text-sm">
                  <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <span>Page {page} of {totalPages}</span>
                  <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-xl font-bold">Packages</h2>
        <div className="mt-3"><PackageManager /></div>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Billing and invoices</h2>
        <div className="mt-3"><BillingSettings /></div>
      </section>
    </main>
  );
}
