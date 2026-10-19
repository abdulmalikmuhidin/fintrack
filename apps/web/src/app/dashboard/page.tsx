import Link from 'next/link';
import DashboardClient from './dashboard-client';
import FinanceNav from '../finance-nav';
import { verifyPageSession } from '../../lib/page-auth';

function currentUtcMonth() {
  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  return {
    startDate: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10),
    endDate: new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10),
  };
}

export default async function DashboardPage() {
  const user = await verifyPageSession();
  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-950">Dashboard unavailable</h1>
          <p className="mt-2 text-amber-900">FinTrack could not verify your session. Check that the API and database are available.</p>
          <Link href="/login" className="mt-4 inline-block font-semibold text-amber-950 underline">Return to login</Link>
        </section>
      </main>
    );
  }
  const period = currentUtcMonth();

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <FinanceNav userLabel={user.name || user.email} />
      <DashboardClient
        initialStartDate={period.startDate}
        initialEndDate={period.endDate}
      />
    </main>
  );
}
