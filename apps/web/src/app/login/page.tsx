'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApiError, authApi } from '../../lib/api';
import { navigateReplace } from '../../lib/navigation';
import LanguageSwitcher from '../../components/language-switcher';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tVal = useTranslations('auth.validation');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError(tVal('enterEmailAndPassword'));
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.login({ email: email.trim(), password });
      // Full page navigation ensures the browser sends the freshly-set
      // session cookie with the request so the server component can read it.
      navigateReplace('/dashboard');
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : tVal('loginError'),
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
        <LanguageSwitcher />
      </div>
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-bold text-slate-950 hover:text-emerald-800">
            Fin<span className="text-emerald-700">Track</span>
          </Link>
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-900">
          {t('welcomeBack')}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{t('loginSubtitle')}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              {t('email')}
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
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              maxLength={128}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            {isSubmitting ? t('loggingIn') : t('loginButton')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {t('newToFinTrack')}{' '}
          <Link href="/register" className="font-semibold text-emerald-800 hover:underline">
            {t('createAnAccount')}
          </Link>
        </p>
      </section>
    </main>
  );
}
