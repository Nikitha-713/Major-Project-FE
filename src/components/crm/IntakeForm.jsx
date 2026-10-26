import { useForm } from 'react-hook-form';
import Button from '../common/Button.jsx';

const input = 'mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2';
const todayKey = () => new Date().toISOString().slice(0, 10);

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
      {error && <p className="mt-1 text-sm text-danger">{error.message}</p>}
    </div>
  );
}

export default function IntakeForm({ consent, onSubmit, serverError }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { previousTherapy: 'no' },
  });
  const previousTherapy = watch('previousTherapy');

  const submit = (v) =>
    onSubmit({
      demographics: { dateOfBirth: v.dateOfBirth, gender: v.gender, occupation: v.occupation, city: v.city },
      presentingConcern: v.presentingConcern,
      history: {
        previousTherapy: v.previousTherapy === 'yes',
        previousTherapyDetails: v.previousTherapyDetails,
        medications: v.medications,
        medicalConditions: v.medicalConditions,
      },
      emergencyContact: { name: v.emergencyName, phone: v.emergencyPhone, relationship: v.emergencyRelationship },
      consent: { accepted: v.consent === true, version: consent.version },
    });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-10">
      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold">About you</legend>
        <Field id="dateOfBirth" label="Date of birth" error={errors.dateOfBirth}>
          <input id="dateOfBirth" type="date" max={todayKey()} className={input}
            {...register('dateOfBirth', { required: 'Enter your date of birth' })} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="gender" label="Gender (optional)"><input id="gender" maxLength={40} className={input} {...register('gender')} /></Field>
          <Field id="occupation" label="Occupation (optional)"><input id="occupation" maxLength={80} className={input} {...register('occupation')} /></Field>
        </div>
        <Field id="city" label="City (optional)"><input id="city" maxLength={80} className={input} {...register('city')} /></Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold">What brings you here</legend>
        <Field id="presentingConcern" label="In your own words" error={errors.presentingConcern}
          hint="Share as much or as little as you like. Your therapist will read this before your first session.">
          <textarea id="presentingConcern" rows={5} maxLength={2000} className={input}
            {...register('presentingConcern', { required: 'Tell us a little about what brings you here', minLength: { value: 10, message: 'Please write at least 10 characters' } })} />
        </Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold">Your history</legend>
        <div>
          <p className="text-sm font-medium">Have you had therapy or counselling before?</p>
          <div className="mt-2 flex gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="radio" value="no" {...register('previousTherapy')} /> No</label>
            <label className="flex items-center gap-2"><input type="radio" value="yes" {...register('previousTherapy')} /> Yes</label>
          </div>
        </div>
        {previousTherapy === 'yes' && (
          <Field id="previousTherapyDetails" label="What was it like?">
            <textarea id="previousTherapyDetails" rows={3} maxLength={1000} className={input} {...register('previousTherapyDetails')} />
          </Field>
        )}
        <Field id="medications" label="Current medications (optional)"><input id="medications" maxLength={500} className={input} {...register('medications')} /></Field>
        <Field id="medicalConditions" label="Medical conditions (optional)"><input id="medicalConditions" maxLength={500} className={input} {...register('medicalConditions')} /></Field>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-xl font-bold">Emergency contact</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="emergencyName" label="Name" error={errors.emergencyName}>
            <input id="emergencyName" className={input} {...register('emergencyName', { required: 'Enter a contact name' })} />
          </Field>
          <Field id="emergencyPhone" label="Phone" error={errors.emergencyPhone}>
            <input id="emergencyPhone" type="tel" maxLength={20} className={input} {...register('emergencyPhone', { required: 'Enter a contact phone number' })} />
          </Field>
        </div>
        <Field id="emergencyRelationship" label="Relationship (optional)"><input id="emergencyRelationship" maxLength={40} className={input} {...register('emergencyRelationship')} /></Field>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl font-bold">{consent.title}</legend>
        <div className="mt-3 max-h-64 space-y-3 overflow-y-auto rounded-lg bg-white p-4 text-sm leading-relaxed ring-1 ring-mist" tabIndex={0} aria-label="Consent text">
          {consent.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" {...register('consent', { required: 'You need to agree to continue' })} />
          <span>I have read and agree to the consent above.</span>
        </label>
        {errors.consent && <p className="mt-1 text-sm text-danger">{errors.consent.message}</p>}
      </fieldset>

      {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit intake form'}</Button>
    </form>
  );
}
