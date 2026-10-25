import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">
        Run your practice. Keep your focus on your clients.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink/75">
        One link for your profile, bookings, payments and session notes.
      </p>
      <Link to="/register"><Button className="mt-8">Create your practice page</Button></Link>
    </main>
  );
}
