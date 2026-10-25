import { Link } from 'react-router-dom';

export default function Hero({ therapist }) {
  const initials = therapist.name
    .replace(/^dr\.?\s+/i, '')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="bg-tide text-white">
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-[auto_1fr] md:py-24">
        <div
          aria-hidden="true"
          className="grid h-36 w-36 place-items-center rounded-full bg-white/10 font-display text-5xl ring-1 ring-white/30 md:h-48 md:w-48 md:text-6xl"
        >
          {initials}
        </div>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">{therapist.name}</h1>
          {therapist.headline && (
            <p className="mt-4 max-w-xl text-lg text-white/85 md:text-xl">{therapist.headline}</p>
          )}
          {therapist.languages.length > 0 && (
            <p className="mt-4 text-sm text-white/75">Sessions in {therapist.languages.join(', ')}</p>
          )}
          <Link
            to={`/${therapist.slug}/book`}
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-tide hover:bg-fog"
          >
            Book a session
          </Link>
        </div>
      </div>
    </header>
  );
}
