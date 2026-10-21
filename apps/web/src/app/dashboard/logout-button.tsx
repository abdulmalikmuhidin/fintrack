'use client';

import { useState } from 'react';
import { ApiError, authApi } from '../../lib/api';
import { navigateReplace } from '../../lib/navigation';

export default function LogoutButton() {
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
          : 'Unable to log out. Please try again.',
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
        {isLoggingOut ? 'Logging out\u2026' : 'Log out'}
      </button>
      {error && (
        <p className="max-w-xs text-right text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
