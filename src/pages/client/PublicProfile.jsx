import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance.js';
import Hero from '../../components/profile/Hero.jsx';
import About from '../../components/profile/About.jsx';
import ServiceCard from '../../components/profile/ServiceCard.jsx';
import Loader from '../../components/common/Loader.jsx';

export default function PublicProfile() {
  const { slug } = useParams();
  const [therapist, setTherapist] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | missing

  useEffect(() => {
    setStatus('loading');
    axiosInstance
      .get(`/therapists/public/${slug}`)
      .then((res) => {
        setTherapist(res.data.therapist);
        setStatus('ready');
      })
      .catch(() => setStatus('missing'));
  }, [slug]);

  // Keeps the browser tab title and description in sync. Link-preview bots use the
  // server-rendered /therapists/public/:slug/share endpoint instead (see backend).
  useEffect(() => {
    if (!therapist) return;
    document.title = `${therapist.name} | Unfazed`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = therapist.headline || `Book a session with ${therapist.name}`;
  }, [therapist]);

  if (status === 'loading') return <Loader label="Loading profile" />;
  if (status === 'missing') {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">We could not find that page</h1>
        <p className="mt-3 text-ink/70">Check the link you were given, or ask your therapist to resend it.</p>
      </main>
    );
  }

  return (
    <>
      <Hero therapist={therapist} />
      <main>
        <About therapist={therapist} />
        {therapist.services.length > 0 && (
          <section className="mx-auto max-w-5xl px-6 pb-20">
            <h2 className="font-display text-2xl font-bold">Sessions</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {therapist.services.map((s) => <ServiceCard key={s.id} service={s} />)}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
