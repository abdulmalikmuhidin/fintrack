'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, authApi } from '../../lib/api';

export default function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    setError('');
    setIsLoggingOut(true);
    try {
      await authApi.logout();
      router.replace('/login');
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to log out. Please try again.',
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={logout}
        disabled={isLoggingOut}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingOut ? 'Logging out…' : 'Log out'}
      </button>
      {error && (
        <p className="max-w-xs text-right text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
