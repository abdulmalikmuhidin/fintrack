import Link from 'next/link';
import AccountsClient from './accounts-client';
import FinanceNav from '../finance-nav';
import { verifyPageSession } from '../../lib/page-auth';

export default async function AccountsPage() {
  const sessionAvailable = await verifyPageSession();
  if (!sessionAvailable) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Accounts unavailable</h1>
        <p className="mt-2 text-gray-600">FinTrack could not verify your session. Check that the API is running.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-700 underline">Return to dashboard</Link>
      </main>
    );
  }
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-blue-700">FinTrack</Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Accounts</h1>
        </div>
        <FinanceNav />
      </header>
      <AccountsClient />
    </main>
  );
}
