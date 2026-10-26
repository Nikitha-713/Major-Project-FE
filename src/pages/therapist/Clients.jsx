import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import ClientTable from '../../components/crm/ClientTable.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';

const field = 'mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm';

export default function Clients() {
  const navigate = useNavigate();
  const [params, setParams] = useState({ search: '', status: '', tag: '', sort: 'name', order: 'asc', page: 1 });
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addError, setAddError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  // Wait for the therapist to stop typing before searching.
  useEffect(() => {
    const t = setTimeout(() => setParams((p) => (p.search === searchInput ? p : { ...p, search: searchInput, page: 1 })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get('/clients', { params })
      .then((res) => { if (!cancelled) { setData(res.data); setError(''); } })
      .catch((err) => { if (!cancelled) setError(getErrorMessage(err)); });
    return () => { cancelled = true; };
  }, [params]);

  const onSort = (key) =>
    setParams((p) => ({ ...p, sort: key, order: p.sort === key && p.order === 'asc' ? 'desc' : 'asc', page: 1 }));

  const addClient = async (values) => {
    setAddError('');
    try {
      const res = await axiosInstance.post('/clients', values);
      navigate(`/dashboard/clients/${res.data.client.id}`);
    } catch (err) {
      setAddError(getErrorMessage(err));
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Clients</h1>
        <Button onClick={() => setShowAdd((s) => !s)}>{showAdd ? 'Close' : 'Add a client'}</Button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit(addClient)} noValidate className="mt-6 grid gap-4 rounded-xl bg-white p-5 ring-1 ring-mist sm:grid-cols-3">
          <div>
            <label htmlFor="newName" className="block text-sm font-medium">Name</label>
            <input id="newName" className={field} {...register('name', { required: 'Enter a name' })} />
            {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="newEmail" className="block text-sm font-medium">Email</label>
            <input id="newEmail" type="email" className={field}
              {...register('email', { required: 'Enter an email address', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} />
            {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="newPhone" className="block text-sm font-medium">Phone (optional)</label>
            <input id="newPhone" type="tel" maxLength={20} className={field} {...register('phone')} />
          </div>
          {addError && <p role="alert" className="text-sm text-danger sm:col-span-3">{addError}</p>}
          <div className="sm:col-span-3"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding…' : 'Add client'}</Button></div>
        </form>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <label htmlFor="search" className="block text-sm font-medium">Search</label>
          <input id="search" type="search" placeholder="Name or email" className={field} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium">Status</label>
          <select id="statusFilter" className={field} value={params.status} onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label htmlFor="tagFilter" className="block text-sm font-medium">Tag</label>
          <select id="tagFilter" className={field} value={params.tag} onChange={(e) => setParams((p) => ({ ...p, tag: e.target.value, page: 1 }))}>
            <option value="">All</option>
            {(data?.allTags || []).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

      <div className="mt-6">
        {!data ? (
          <Loader label="Loading clients" />
        ) : data.clients.length === 0 ? (
          <p className="rounded-xl bg-white p-6 ring-1 ring-mist">
            {params.search || params.status || params.tag
              ? 'No clients match these filters.'
              : 'No clients yet. They appear here when someone books with you, or you can add one yourself.'}
          </p>
        ) : (
          <>
            <ClientTable clients={data.clients} sort={params.sort} order={params.order} onSort={onSort} />
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-ink/70">{data.total} client{data.total === 1 ? '' : 's'}</span>
              <div className="flex items-center gap-3">
                <Button variant="secondary" disabled={params.page <= 1} onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
                <span>Page {params.page} of {totalPages}</span>
                <Button variant="secondary" disabled={params.page >= totalPages} onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
