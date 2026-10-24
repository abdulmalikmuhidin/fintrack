import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import LanguageSwitcher from '../components/language-switcher';

export default async function Home() {
  const t = await getTranslations('home');

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute right-4 top-4 sm:right-8 sm:top-8">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-2xl text-center">
        <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
          {t('title')}
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          {t('subtitle')}
        </p>
        <div className="mb-8 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-emerald-900">
            {t('cardTitle')}
          </h2>
          <p className="text-emerald-900">
            {t('cardDescription')}
          </p>
        </div>
        <div className="mb-8 flex justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800"
          >
            {t('createAccount')}
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t('login')}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 font-semibold text-gray-900">
              {t('featureDashboardTitle')}
            </h3>
            <p className="text-gray-600">
              {t('featureDashboardDesc')}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 font-semibold text-gray-900">
              {t('featureTransactionsTitle')}
            </h3>
            <p className="text-gray-600">
              {t('featureTransactionsDesc')}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-2 font-semibold text-gray-900">
              {t('featureAccountsTitle')}
            </h3>
            <p className="text-gray-600">
              {t('featureAccountsDesc')}
            </p>
          </div>
        </div>
        <footer className="mt-12 text-sm text-gray-500">
          <p>{t('footer')}</p>
        </footer>
      </div>
    </main>
  );
}
