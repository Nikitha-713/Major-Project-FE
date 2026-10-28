import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Button from '../../components/common/Button.jsx';

export default function Dashboard() {
  const { therapist, logout } = useAuth();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="font-display text-3xl font-bold">Welcome, {therapist?.name || 'Therapist'}</h1>
        <Button onClick={logout}>Log out</Button>
      </div>

      {/* THIS IS THE MENU YOU ARE MISSING */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mb-12">
        <Link to="/dashboard/schedule" className="rounded-xl bg-white p-6 ring-1 ring-mist hover:ring-tide transition">
          <h2 className="font-bold text-lg">Schedule</h2>
          <p className="text-sm text-ink/70">Manage your calendar and sessions.</p>
        </Link>
        <Link to="/dashboard/clients" className="rounded-xl bg-white p-6 ring-1 ring-mist hover:ring-tide transition">
          <h2 className="font-bold text-lg">Clients</h2>
          <p className="text-sm text-ink/70">View your client list and chat.</p>
        </Link>
        <Link to="/dashboard/notes" className="rounded-xl bg-white p-6 ring-1 ring-mist hover:ring-tide transition">
          <h2 className="font-bold text-lg">Notes</h2>
          <p className="text-sm text-ink/70">Write and share clinical notes.</p>
        </Link>
        <Link to="/dashboard/payments" className="rounded-xl bg-white p-6 ring-1 ring-mist hover:ring-tide transition">
          <h2 className="font-bold text-lg">Payments</h2>
          <p className="text-sm text-ink/70">View invoices and revenue.</p>
        </Link>
        <Link to="/dashboard/analytics" className="rounded-xl bg-white p-6 ring-1 ring-mist hover:ring-tide transition">
          <h2 className="font-bold text-lg">Analytics</h2>
          <p className="text-sm text-ink/70">See your practice stats.</p>
        </Link>
      </div>

      <div className="rounded-xl bg-white p-6 ring-1 ring-mist">
        <h2 className="font-display text-xl font-bold mb-2">Your public link</h2>
        <p className="text-ink/70 mb-4">Share this link with your clients so they can book sessions.</p>
        <a href={`/${therapist?.slug}`} target="_blank" rel="noreferrer" className="text-tide underline font-medium">
          /{therapist?.slug}
        </a>
      </div>
    </main>
  );
}