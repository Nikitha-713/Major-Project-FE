import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext.jsx';
import axiosInstance, { getErrorMessage } from '../../axiosInstance.js';
import Button from '../../components/common/Button.jsx';

const toList = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);
const inputClass = 'mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2';

export default function Dashboard() {
  const { therapist, setTherapist } = useAuth();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);

  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: therapist.name,
      slug: therapist.slug,
      headline: therapist.headline,
      bio: therapist.bio,
      specializations: therapist.specializations.join(', '),
      languages: therapist.languages.join(', '),
      services: therapist.services.map((s) => ({
        title: s.title,
        description: s.description,
        durationMin: s.durationMin,
        price: s.price ?? '',
      })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'services' });

  const publicUrl = `${window.location.origin}/${therapist.slug}`;

  const onSubmit = async (values) => {
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        headline: values.headline,
        bio: values.bio,
        specializations: toList(values.specializations),
        languages: toList(values.languages),
        services: values.services.map((s) => ({
          title: s.title,
          description: s.description,
          durationMin: Number(s.durationMin),
          price: s.price === '' || s.price == null ? null : Number(s.price),
        })),
      };
      const res = await axiosInstance.put('/therapists/me', payload);
      setTherapist(res.data.therapist);
      setMessage({ type: 'ok', text: 'Profile saved' });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl font-bold">Your profile</h1>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-mist">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink/60">Your public link</p>
          <a href={publicUrl} target="_blank" rel="noreferrer" className="block truncate font-medium text-tide underline">{publicUrl}</a>
        </div>
        <Button variant="secondary" onClick={copyLink}>{copied ? 'Copied' : 'Copy link'}</Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input id="name" className={inputClass} {...register('name', { required: 'Enter your name' })} />
          {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium">Link name</label>
          <input id="slug" className={inputClass}
            {...register('slug', {
              required: 'Enter a link name',
              pattern: { value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Use lowercase letters, numbers and single hyphens' },
              minLength: { value: 3, message: 'Use at least 3 characters' },
            })} />
          {errors.slug && <p className="mt-1 text-sm text-danger">{errors.slug.message}</p>}
        </div>

        <div>
          <label htmlFor="headline" className="block text-sm font-medium">Headline</label>
          <input id="headline" maxLength={140} className={inputClass} {...register('headline')} />
          <p className="mt-1 text-xs text-ink/60">One sentence shown under your name. Also used in link previews.</p>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium">About you</label>
          <textarea id="bio" rows={5} maxLength={2000} className={inputClass} {...register('bio')} />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="specializations" className="block text-sm font-medium">Works with</label>
            <input id="specializations" className={inputClass} {...register('specializations')} />
            <p className="mt-1 text-xs text-ink/60">Separate with commas</p>
          </div>
          <div>
            <label htmlFor="languages" className="block text-sm font-medium">Languages</label>
            <input id="languages" className={inputClass} {...register('languages')} />
            <p className="mt-1 text-xs text-ink/60">Separate with commas</p>
          </div>
        </div>

        <fieldset>
          <legend className="font-display text-xl font-bold">Sessions you offer</legend>
          <div className="mt-4 space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl bg-white p-4 ring-1 ring-mist">
                <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                  <div>
                    <label htmlFor={`svc-title-${index}`} className="block text-sm font-medium">Title</label>
                    <input id={`svc-title-${index}`} className={inputClass}
                      {...register(`services.${index}.title`, { required: 'Give this session a title' })} />
                    {errors.services?.[index]?.title && (
                      <p className="mt-1 text-sm text-danger">{errors.services[index].title.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`svc-dur-${index}`} className="block text-sm font-medium">Length</label>
                    <select id={`svc-dur-${index}`} className={inputClass} {...register(`services.${index}.durationMin`)}>
                      {[30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`svc-price-${index}`} className="block text-sm font-medium">Price (INR)</label>
                    <input id={`svc-price-${index}`} type="number" min="0" className={inputClass}
                      {...register(`services.${index}.price`)} />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor={`svc-desc-${index}`} className="block text-sm font-medium">Description</label>
                  <textarea id={`svc-desc-${index}`} rows={2} maxLength={400} className={inputClass}
                    {...register(`services.${index}.description`)} />
                </div>
                <button type="button" onClick={() => remove(index)} className="mt-3 text-sm font-medium text-danger underline">
                  Remove session
                </button>
              </div>
            ))}
          </div>
          {fields.length < 8 && (
            <Button type="button" variant="secondary" className="mt-4"
              onClick={() => append({ title: '', description: '', durationMin: 60, price: '' })}>
              Add a session
            </Button>
          )}
        </fieldset>

        {message.text && (
          <p role={message.type === 'error' ? 'alert' : 'status'}
            className={`text-sm ${message.type === 'error' ? 'text-danger' : 'text-tide'}`}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save profile'}</Button>
      </form>
    </main>
  );
}
