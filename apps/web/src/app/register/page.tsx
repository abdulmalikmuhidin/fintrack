'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ApiError, authApi } from '../../lib/api';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length > 100) {
      setError('Enter a name between 1 and 100 characters.');
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setError('Your password must be between 12 and 128 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The password confirmation does not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.register({ name: name.trim(), email: email.trim(), password });
      setSuccess(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to create your account. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <Link href="/" className="text-sm font-bold text-slate-950 hover:text-emerald-800">
          Fin<span className="text-emerald-700">Track</span>
        </Link>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Start organizing your personal finances.
        </p>

        {success ? (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4" role="status">
            <p className="font-medium text-green-900">Your account has been created.</p>
            <Link
              href="/login"
              className="mt-3 inline-flex font-semibold text-green-800 underline underline-offset-2"
            >
              Continue to login
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                maxLength={100}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
              <p className="mt-1 text-xs text-gray-500">Use at least 12 characters.</p>
            </div>
            <div>
              <label htmlFor="confirmation" className="mb-1 block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                id="confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                maxLength={128}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}

        {!success && (
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-800 hover:underline">
              Log in
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
