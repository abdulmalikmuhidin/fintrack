'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const currentLocale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(nextLocale: string) {
    if (nextLocale === currentLocale) return;

    // Set cookie for 1 year
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;SameSite=Lax`;
    try {
      localStorage.setItem('fintrack_locale', nextLocale);
    } catch {
      // Ignore if localStorage unavailable
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <label htmlFor="language-switcher" className="sr-only">
        Language / ቋንቋ
      </label>
      <div className="flex items-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
        <span className="mr-1.5 text-slate-400" aria-hidden="true">
          🌐
        </span>
        <select
          id="language-switcher"
          aria-label="Select language"
          value={currentLocale}
          disabled={isPending}
          onChange={(e) => onSelectChange(e.target.value)}
          className="cursor-pointer bg-transparent font-semibold text-slate-700 outline-none disabled:opacity-60"
        >
          <option value="en">English</option>
          <option value="am">አማርኛ</option>
        </select>
      </div>
    </div>
  );
}

