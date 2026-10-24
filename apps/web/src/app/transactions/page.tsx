import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import FinanceNav from '../finance-nav';
import TransactionsClient from './transactions-client';
import { verifyPageSession } from '../../lib/page-auth';

export default async function TransactionsPage() {
  const user = await verifyPageSession();
  const t = await getTranslations('transactions');

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">{t('unavailableTitle')}</h1>
        <p className="mt-2 text-gray-600">{t('unavailableDesc')}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-700 underline">
          {t('returnToDashboard')}
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
      <FinanceNav userLabel={user.name || user.email} />
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          {t('sectionHeader')}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
          {t('title')}
        </h1>
        <p className="mt-2 text-slate-600">{t('subtitle')}</p>
      </header>
      <TransactionsClient />
    </main>
  );
}
