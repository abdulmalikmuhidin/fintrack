'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import LogoutButton from './dashboard/logout-button';
import LanguageSwitcher from '../components/language-switcher';

export default function FinanceNav({ userLabel }: { userLabel: string }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const links = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/accounts', label: t('accounts') },
    { href: '/transactions', label: t('transactions') },
  ];

  return (
    <header className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-slate-950">
          Fin<span className="text-emerald-700">Track</span>
        </Link>
        <div className="flex max-w-full flex-wrap items-center justify-end gap-3">
          <LanguageSwitcher />
          <p className="max-w-48 truncate text-sm text-slate-600" title={userLabel}>
            {userLabel}
          </p>
          <LogoutButton />
        </div>
      </div>
      <nav
        aria-label={t('mainNav')}
        className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2"
      >
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
