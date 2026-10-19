"use client";

import Link from "next/link";
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
} from "recharts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, DashboardSummary, dashboardApi } from "../../lib/api";
import { formatMinorUnits } from "../../lib/money";

type PeriodPreset =
  "this-month" | "last-month" | "last-three-months" | "this-year" | "custom";

const COLORS = [
  "#047857",
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#d97706",
  "#475569",
];

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function periodFor(preset: Exclude<PeriodPreset, "custom">, now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  if (preset === "last-month") {
    return {
      startDate: dateString(new Date(Date.UTC(year, month - 1, 1))),
      endDate: dateString(new Date(Date.UTC(year, month, 0))),
    };
  }
  if (preset === "last-three-months") {
    return {
      startDate: dateString(new Date(Date.UTC(year, month - 2, 1))),
      endDate: dateString(new Date(Date.UTC(year, month + 1, 0))),
    };
  }
  if (preset === "this-year") {
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
  const [preset, setPreset] = useState<PeriodPreset>("this-month");
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [currency, setCurrency] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!startDate || !endDate) {
      setSummary(null);
      setError("Choose both a start date and an end date.");
      setLoading(false);
      return;
    }
    if (startDate > endDate) {
      setSummary(null);
      setError("The start date must be before or equal to the end date.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await dashboardApi.getSummary({ startDate, endDate });
      setSummary(result);
      setCurrency((current) =>
        result.currencies.some((item) => item.currency === current)
          ? current
          : (result.currencies[0]?.currency ?? ""),
      );
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace("/login");
        return;
      }
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Unable to load your financial summary.",
      );
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [endDate, router, startDate]);

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
          label: new Intl.DateTimeFormat(undefined, {
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(`${item.month}-01T00:00:00.000Z`)),
        })),
    [currency, summary],
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

  function choosePreset(value: PeriodPreset) {
    setPreset(value);
    if (value !== "custom") {
      const range = periodFor(value);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }

  return (
    <div className="mt-8 space-y-7">
      <section className="flex flex-col justify-between gap-5 rounded-2xl bg-slate-950 p-6 text-white sm:flex-row sm:items-end sm:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Your money, in focus
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Financial overview
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            A clear view of recorded activity, with every currency kept
            separate.
          </p>
        </div>
        <div className="grid gap-2 sm:min-w-60">
          <label
            htmlFor="reporting-period"
            className="text-xs font-semibold uppercase tracking-wide text-slate-300"
          >
            Reporting period (UTC)
          </label>
          <select
            id="reporting-period"
            value={preset}
            onChange={(event) =>
              choosePreset(event.target.value as PeriodPreset)
            }
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white"
          >
            <option value="this-month">This month</option>
            <option value="last-month">Last month</option>
            <option value="last-three-months">Last 3 months</option>
            <option value="this-year">This year</option>
            <option value="custom">Custom dates</option>
          </select>
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label
            htmlFor="summary-start"
            className="mb-1 block text-xs font-semibold text-slate-600"
          >
            From
          </label>
          <input
            id="summary-start"
            type="date"
            value={startDate}
            onChange={(event) => {
              setPreset("custom");
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
            Through
          </label>
          <input
            id="summary-end"
            type="date"
            value={endDate}
            onChange={(event) => {
              setPreset("custom");
              setEndDate(event.target.value);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        {loading && (
          <p className="text-sm text-slate-500" role="status">
            Updating summary…
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
            className="mt-2 font-semibold underline underline-offset-2"
          >
            Try again
          </button>
        </section>
      )}

      {loading && !summary ? (
        <p
          className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600"
          role="status"
        >
          Loading your financial summary…
        </p>
      ) : summary ? (
        <>
          {summary.currencies.length > 0 ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Summary
                  </h2>
                  <p className="text-sm text-slate-500">
                    All amounts are shown in the selected currency only.
                  </p>
                </div>
                {summary.currencies.length > 1 && (
                  <div>
                    <label
                      htmlFor="summary-currency"
                      className="mr-2 text-sm font-medium text-slate-700"
                    >
                      Currency
                    </label>
                    <select
                      id="summary-currency"
                      value={currency}
                      onChange={(event) => setCurrency(event.target.value)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      {summary.currencies.map((item) => (
                        <option key={item.currency} value={item.currency}>
                          {item.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Tracked balance"
                  value={formatMinorUnits(
                    selected?.balanceMinor ?? 0,
                    currency,
                  )}
                  detail="Net of all recorded income and expenses"
                  emphasis
                />
                <MetricCard
                  label="Income"
                  value={formatMinorUnits(selected?.incomeMinor ?? 0, currency)}
                  detail="During selected period"
                  positive
                />
                <MetricCard
                  label="Expenses"
                  value={formatMinorUnits(
                    selected?.expenseMinor ?? 0,
                    currency,
                  )}
                  detail="During selected period"
                />
                <MetricCard
                  label="Net cash flow"
                  value={formatMinorUnits(
                    selected?.netCashFlowMinor ?? 0,
                    currency,
                  )}
                  detail="Period income minus expenses"
                  positive={(selected?.netCashFlowMinor ?? 0) >= 0}
                />
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Tracked balance is derived from recorded transactions, not a
                bank balance. Opening balances and transfers are not currently
                modeled.
              </p>

              <div className="grid gap-5 xl:grid-cols-2">
                <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-slate-950">
                    Income and expenses over time
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Monthly totals for {currency}, within the selected reporting
                    period.
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
                                compactMinor(value, currency)
                              }
                              width={76}
                            />
                            <Tooltip
                              formatter={(value) =>
                                formatMinorUnits(Number(value), currency)
                              }
                              labelStyle={{ color: "#0f172a" }}
                            />
                            <Legend />
                            <Bar
                              dataKey="incomeMinor"
                              name="Income"
                              fill="#047857"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="expenseMinor"
                              name="Expenses"
                              fill="#e11d48"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <ul className="sr-only">
                        {monthlyData.map((item) => (
                          <li key={item.month}>
                            {item.label}: income{" "}
                            {formatMinorUnits(item.incomeMinor, currency)},
                            expenses{" "}
                            {formatMinorUnits(item.expenseMinor, currency)}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <ChartEmpty>
                      There is no income or expense activity for this currency
                      and period yet.
                    </ChartEmpty>
                  )}
                </section>

                <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
                  <h2 className="text-lg font-semibold text-slate-950">
                    Expense breakdown
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Expense transactions by category for {currency}.
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
                                formatMinorUnits(Number(value), currency)
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
                              {formatMinorUnits(item.amountMinor, currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <ChartEmpty>
                      No expenses were recorded in this currency during the
                      selected period.
                    </ChartEmpty>
                  )}
                </section>
              </div>
            </>
          ) : (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h2 className="text-lg font-semibold text-slate-950">
                Start with an account
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Create an account to see currency-specific balances and activity
                here.
              </p>
              <Link
                href="/accounts"
                className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Add an account
              </Link>
            </section>
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Recent transactions
                </h2>
                <p className="text-sm text-slate-500">
                  Latest recorded activity across your accounts.
                </p>
              </div>
              <Link
                href="/transactions"
                className="text-sm font-semibold text-emerald-800 hover:underline"
              >
                View all transactions
              </Link>
            </div>
            {summary.recentTransactions.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Date
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Transaction
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Account
                      </th>
                      <th scope="col" className="px-5 py-3 font-semibold">
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3 text-right font-semibold"
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.recentTransactions.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                            timeZone: "UTC",
                          }).format(new Date(item.date))}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">
                            {item.description || item.category}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-500">
                              {item.category}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {item.accountName}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.type === "income" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-3 text-right font-semibold ${item.type === "income" ? "text-emerald-800" : "text-slate-900"}`}
                        >
                          {item.type === "income" ? "+" : "−"}
                          {formatMinorUnits(item.amountMinor, item.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="font-medium text-slate-900">
                  No transactions recorded yet.
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Add your first transaction to begin tracking activity.
                </p>
                <Link
                  href="/transactions"
                  className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  Add a transaction
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
      className={`min-w-0 rounded-xl border p-5 ${emphasis ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}
    >
      <h3 className="text-sm font-medium text-slate-600">{label}</h3>
      <p
        className={`mt-3 break-words text-2xl font-bold tracking-tight ${positive ? "text-emerald-800" : "text-slate-950"}`}
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

function compactMinor(amountMinor: number, currency: string): string {
  const digits =
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amountMinor / 10 ** digits);
}
