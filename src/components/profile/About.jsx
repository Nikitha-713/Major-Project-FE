export default function About({ therapist }) {
  const { bio, specializations } = therapist;
  if (!bio && specializations.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-14">
      <h2 className="font-display text-2xl font-bold">About</h2>
      <div className="mt-6 grid gap-10 md:grid-cols-[3fr_2fr]">
        {bio && <p className="max-w-prose whitespace-pre-line leading-relaxed text-ink/85">{bio}</p>}
        {specializations.length > 0 && (
          <div>
            <h3 className="font-semibold">Works with</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {specializations.map((s) => (
                <li key={s} className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-mist">{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
