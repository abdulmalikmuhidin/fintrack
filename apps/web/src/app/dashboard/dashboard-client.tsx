'use client';

import Link from 'next/link';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ApiError, DashboardSummary, dashboardApi } from '../../lib/api';
import { formatMinorUnits } from '../../lib/money';

type PeriodPreset =
  | 'this-month'
  | 'last-month'
  | 'last-three-months'
  | 'this-year'
  | 'custom';

const COLORS = [
  '#047857',
  '#0f766e',
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#d97706',
  '#475569',
];

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function periodFor(preset: Exclude<PeriodPreset, 'custom'>, now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  if (preset === 'last-month') {
    return {
      startDate: dateString(new Date(Date.UTC(year, month - 1, 1))),
      endDate: dateString(new Date(Date.UTC(year, month, 0))),
    };
  }
  if (preset === 'last-three-months') {
    return {
      startDate: dateString(new Date(Date.UTC(year, month - 2, 1))),
      endDate: dateString(new Date(Date.UTC(year, month + 1, 0))),
    };
  }
  if (preset === 'this-year') {
    return {
      startDate: dateString(new Date(Date.UTC(year, 0, 1))),
      endDate: dateString(new Date(Date.UTC(year, 11, 31))),
    };
  }
  return {
    startDate: dateString(new Date(Date.UTC(year, month, 1))),
    endDate: dateString(new Date(Date.UTC(year, month + 1, 0))),
  };
}

export default function DashboardClient({
  initialStartDate,
  initialEndDate,
}: {
  initialStartDate: string;
  initialEndDate: string;
}) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [preset, setPreset] = useState<PeriodPreset>('this-month');
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!startDate || !endDate) {
      setSummary(null);
      setError(t('validation.chooseBothDates'));
      setLoading(false);
      return;
    }
    if (startDate > endDate) {
      setSummary(null);
      setError(t('validation.dateOrder'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await dashboardApi.getSummary({ startDate, endDate });
      setSummary(result);
      setCurrency((current) =>
        result.currencies.some((item) => item.currency === current)
          ? current
          : (result.currencies[0]?.currency ?? ''),
      );
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : t('validation.loadError'),
      );
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [endDate, router, startDate, t]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 150);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const selected = summary?.currencies.find(
    (item) => item.currency === currency,
  );
  const monthlyData = useMemo(
    () =>
      (summary?.monthly ?? [])
        .filter((item) => item.currency === currency)
        .map((item) => ({
          ...item,
          label: new Intl.DateTimeFormat(locale === 'am' ? 'am-ET' : 'en-US', {
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          }).format(new Date(`${item.month}-01T00:00:00.000Z`)),
        })),
    [currency, locale, summary],
  );
  const categoryData = useMemo(
    () =>
      (summary?.expenseCategories ?? [])
        .filter((item) => item.currency === currency)
        .map((item) => ({
          name: item.category,
          amountMinor: item.amountMinor,
        })),
    [currency, summary],
  );

  function choosePreset(next: PeriodPreset) {
    setPreset(next);
    if (next !== 'custom') {
      const range = periodFor(next);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }

  return (
    <div className="mt-8 space-y-7">
      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300">
            {t('yourMoneyInFocus')}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {t('financialOverview')}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid gap-2 sm:min-w-60">
          <label
            htmlFor="reporting-period"
            className="text-xs font-semibold uppercase tracking-wide text-slate-300"
          >
            {t('reportingPeriod')}
          </label>
          <select
            id="reporting-period"
            value={preset}
            onChange={(event) =>
              choosePreset(event.target.value as PeriodPreset)
            }
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white"
          >
            <option value="this-month">{t('presets.thisMonth')}</option>
            <option value="last-month">{t('presets.lastMonth')}</option>
            <option value="last-three-months">{t('presets.last3Months')}</option>
            <option value="this-year">{t('presets.thisYear')}</option>
            <option value="custom">{t('presets.custom')}</option>
          </select>
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label
            htmlFor="summary-start"
            className="mb-1 block text-xs font-semibold text-slate-600"
          >
            {t('from')}
          </label>
          <input
            id="summary-start"
            type="date"
            value={startDate}
            onChange={(event) => {
              setPreset('custom');
              setStartDate(event.target.value);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label
            htmlFor="summary-end"
            className="mb-1 block text-xs font-semibold text-slate-600"
          >
            {t('through')}
          </label>
          <input
            id="summary-end"
            type="date"
            value={endDate}
            onChange={(event) => {
              setPreset('custom');
              setEndDate(event.target.value);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        {loading && (
          <p className="text-sm text-slate-500" role="status">
            {t('updatingSummary')}
          </p>
        )}
        {summary && (
          <p className="text-sm text-slate-500" aria-live="polite">
            {summary.period.startDate} to {summary.period.endDate} (UTC)
          </p>
        )}
      </section>

      {error && (
        <section
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 font-semibold underline"
          >
            {tCommon('tryAgain')}
          </button>
        </section>
      )}

      {summary ? (
        <>
          {summary.currencies.length ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="currency-filter"
                    className="text-sm font-semibold text-slate-700"
                  >
                    {t('currencyFilter')}:
                  </label>
                  <select
                    id="currency-filter"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900"
                  >
                    {summary.currencies.map((item) => (
                      <option key={item.currency} value={item.currency}>
                        {item.currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label={t('trackedBalance')}
                  value={formatMinorUnits(
                    selected?.balanceMinor ?? 0,
                    currency,
                    locale,
                  )}
                  detail={t('trackedBalanceDetail')}
                  emphasis
                />
                <MetricCard
                  label={t('income')}
                  value={formatMinorUnits(selected?.incomeMinor ?? 0, currency, locale)}
                  detail={t('incomeDetail')}
                  positive
                />
                <MetricCard
                  label={t('expenses')}
                  value={formatMinorUnits(
                    selected?.expenseMinor ?? 0,
                    currency,
                    locale,
                  )}
                  detail={t('expensesDetail')}
                />
                <MetricCard
                  label={t('netCashFlow')}
                  value={formatMinorUnits(
                    selected?.netCashFlowMinor ?? 0,
                    currency,
                    locale,
                  )}
                  detail={t('netCashFlowDetail')}
                  positive={(selected?.netCashFlowMinor ?? 0) >= 0}
                />
              </div>
              <p className="text-xs leading-5 text-slate-500">
                {t('balanceHelp')}
              </p>

              <div className="grid gap-5 xl:grid-cols-2">
                <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-slate-950">
                    {t('monthlyTrends')}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t('monthlyTrendsDesc', { currency })}
                  </p>
                  {monthlyData.length ? (
                    <>
                      <div
                        className="mt-5 h-72"
                        role="img"
                        aria-label={`Monthly income and expenses chart in ${currency}`}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={monthlyData}
                            margin={{ top: 8, right: 12, left: 8, bottom: 4 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis dataKey="label" tickLine={false} />
                            <YAxis
                              tickFormatter={(value: number) =>
                                compactMinor(value, currency, locale)
                              }
                              width={76}
                            />
                            <Tooltip
                              formatter={(value) =>
                                formatMinorUnits(Number(value), currency, locale)
                              }
                              labelStyle={{ color: '#0f172a' }}
                            />
                            <Legend />
                            <Bar
                              dataKey="incomeMinor"
                              name={t('chartLabels.income')}
                              fill="#047857"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="expenseMinor"
                              name={t('chartLabels.expenses')}
                              fill="#e11d48"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <ul className="sr-only">
                        {monthlyData.map((item) => (
                          <li key={item.month}>
                            {item.label}: income{' '}
                            {formatMinorUnits(item.incomeMinor, currency, locale)},
                            expenses{' '}
                            {formatMinorUnits(item.expenseMinor, currency, locale)}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <ChartEmpty>
                      {t('noMonthlyData')}
                    </ChartEmpty>
                  )}
                </section>

                <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-slate-950">
                    {t('expenseBreakdown')}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t('expenseBreakdownDesc', { currency })}
                  </p>
                  {categoryData.length ? (
                    <>
                      <div
                        className="mt-3 h-72"
                        role="img"
                        aria-label={`Expense categories chart in ${currency}`}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              dataKey="amountMinor"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={94}
                              label={({ name }) => name}
                            >
                              {categoryData.map((item, index) => (
                                <Cell
                                  key={`${item.name}-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) =>
                                formatMinorUnits(Number(value), currency, locale)
                              }
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <ul
                        className="space-y-1 text-sm text-slate-600"
                        aria-label="Expense totals by category"
                      >
                        {categoryData.map((item) => (
                          <li
                            key={item.name}
                            className="flex justify-between gap-4"
                          >
                            <span>{item.name}</span>
                            <span className="font-medium text-slate-900">
                              {formatMinorUnits(item.amountMinor, currency, locale)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <ChartEmpty>
                      {t('noExpenseData')}
                    </ChartEmpty>
                  )}
                </section>
              </div>
            </>
          ) : (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-950">
                {t('startWithAccount')}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {t('startWithAccountDesc')}
              </p>
              <Link
                href="/accounts"
                className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                {t('addAccount')}
              </Link>
            </section>
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {t('recentTransactions')}
                </h2>
                <p className="text-sm text-slate-500">
                  {t('recentTransactionsDesc')}
                </p>
              </div>
              <Link
                href="/transactions"
                className="text-sm font-semibold text-emerald-800 hover:underline"
              >
                {t('viewAllTransactions')}
              </Link>
            </div>
            {summary.recentTransactions.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        {t('table.date')}
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        {tCommon('description')}
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        {t('table.account')}
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        {t('table.type')}
                      </th>
                      <th scope="col" className="px-5 py-3 text-right font-semibold">
                        {t('table.amount')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.recentTransactions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                          {new Intl.DateTimeFormat(locale === 'am' ? 'am-ET' : 'en-US', {
                            dateStyle: 'medium',
                            timeZone: 'UTC',
                          }).format(new Date(item.date))}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {item.description || item.category}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {item.accountName}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.type === 'income' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${item.type === 'income' ? 'text-emerald-800' : 'text-slate-900'}`}
                        >
                          {item.type === 'income' ? '+' : '−'}
                          {formatMinorUnits(item.amountMinor, item.currency, locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="font-medium text-slate-900">
                  {t('noTransactions')}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {t('noTransactionsDesc')}
                </p>
                <Link
                  href="/transactions"
                  className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  {t('addTransaction')}
                </Link>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  emphasis = false,
  positive = false,
}: {
  label: string;
  value: string;
  detail: string;
  emphasis?: boolean;
  positive?: boolean;
}) {
  return (
    <article
      className={`min-w-0 rounded-xl border p-5 ${emphasis ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}
    >
      <h3 className="text-sm font-medium text-slate-600">{label}</h3>
      <p
        className={`mt-3 break-words text-2xl font-bold tracking-tight ${positive ? 'text-emerald-800' : 'text-slate-950'}`}
      >
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function ChartEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 flex min-h-64 items-center justify-center rounded-lg bg-slate-50 px-6 text-center text-sm text-slate-600">
      {children}
    </p>
  );
}

function compactMinor(amountMinor: number, currency: string, locale?: string): string {
  const digits =
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  const resolvedLocale = locale === 'am' ? 'am-ET' : locale === 'en' ? 'en-US' : undefined;
  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amountMinor / 10 ** digits);
}
