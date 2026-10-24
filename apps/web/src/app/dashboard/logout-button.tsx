'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ApiError, authApi } from '../../lib/api';
import { navigateReplace } from '../../lib/navigation';

export default function LogoutButton() {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth.validation');
  const [error, setError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setError('');
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      // Full page navigation ensures the cleared cookie takes effect
      // and the server sees the unauthenticated state.
      navigateReplace('/login');
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : tAuth('logoutError'),
      );
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={logout}
        disabled={isLoggingOut}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingOut ? t('loggingOut') : t('logout')}
      </button>
      {error && (
        <p className="max-w-xs text-right text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
