import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext.jsx';
import { getErrorMessage } from '../../axiosInstance.js';
import Button from '../../components/common/Button.jsx';

export default function Register() {
  const { register: signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ name, email, password }) => {
    setServerError('');
    try {
      await signUp(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-display text-3xl font-bold">Create your practice page</h1>
      <p className="mt-2 text-ink/70">You will get a personal link to share with clients.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Full name</label>
          <input id="name" autoComplete="name" className="mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2"
            {...register('name', { required: 'Enter your full name', minLength: { value: 2, message: 'Name is too short' } })} />
          {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input id="email" type="email" autoComplete="email" className="mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2"
            {...register('email', { required: 'Enter your email address', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' } })} />
          {errors.email && <p className="mt-1 text-sm text-danger">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input id="password" type="password" autoComplete="new-password" className="mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2"
            {...register('password', { required: 'Choose a password', minLength: { value: 8, message: 'Use at least 8 characters' } })} />
          {errors.password && <p className="mt-1 text-sm text-danger">{errors.password.message}</p>}
        </div>

        {serverError && <p role="alert" className="text-sm text-danger">{serverError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink/70">
        Already have an account? <Link to="/login" className="font-medium text-tide underline">Log in</Link>
      </p>
    </main>
  );
}
