import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError, getCurrentUserForServer } from '../../lib/api';
import FinanceNav from '../finance-nav';

export default async function DashboardPage() {
  const token = cookies().get('fintrack_session')?.value;
  if (!token) {
    redirect('/login');
  }

  let user;
  try {
    user = await getCurrentUserForServer(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12">
        <section className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-8">
          <h1 className="text-xl font-semibold text-amber-950">Dashboard unavailable</h1>
          <p className="mt-2 text-amber-900">
            FinTrack could not verify your session. Check that the API is running and try again.
          </p>
          <Link href="/login" className="mt-4 inline-block font-semibold text-amber-950 underline">
            Return to login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <header className="flex items-start justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-blue-700">
            FinTrack
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Signed in as <span className="font-medium text-gray-900">{user.name || user.email}</span>
          </p>
        </div>
        <FinanceNav />
      </header>

      <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
          Welcome to FinTrack
        </p>
        <h2 className="mt-2 text-2xl font-bold text-gray-900">Your financial overview is on its way.</h2>
        <p className="mt-3 max-w-2xl leading-7 text-gray-700">
          There are no financial features to show yet. Transaction tracking, budgets, and insights
          will be added in a later milestone.
        </p>
      </section>
    </main>
  );
}
