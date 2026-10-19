import Link from 'next/link';
import AccountsClient from './accounts-client';
import FinanceNav from '../finance-nav';
import { verifyPageSession } from '../../lib/page-auth';

export default async function AccountsPage() {
  const user = await verifyPageSession();
  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Accounts unavailable</h1>
        <p className="mt-2 text-gray-600">FinTrack could not verify your session. Check that the API and database are available.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-700 underline">Return to dashboard</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <FinanceNav userLabel={user.name || user.email} />
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Your finances</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Accounts</h1>
        <p className="mt-2 text-slate-600">Manage the accounts used to organize your recorded activity.</p>
      </header>
      <AccountsClient />
    </main>
  );
}
