import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
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
  const t = await getTranslations('dashboard');

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-950">{t('unavailableTitle')}</h1>
          <p className="mt-2 text-amber-900">{t('unavailableDesc')}</p>
          <Link href="/login" className="mt-4 inline-block font-semibold text-amber-950 underline">
            {t('returnToLogin')}
          </Link>
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
