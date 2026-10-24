'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Account,
  ApiError,
  Transaction,
  TransactionInput,
  TransactionSortField,
  TransactionType,
  accountsApi,
  transactionsApi,
} from '../../lib/api';
import {
  currencyFractionDigits,
  formatMinorUnits,
  minorUnitsToInput,
  parseAmountToMinorUnits,
} from '../../lib/money';

interface FormState {
  accountId: string;
  type: TransactionType;
  amount: string;
  category: string;
  description: string;
  date: string;
}

function newForm(accountId = ''): FormState {
  return {
    accountId,
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  };
}

export default function TransactionsClient() {
  const router = useRouter();
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const tVal = useTranslations('transactions.validation');
  const locale = useLocale();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [accountFilter, setAccountFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<TransactionSortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [form, setForm] = useState<FormState>(newForm());
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const listVersion = useRef(0);

  const selectedAccount = accounts.find((item) => item.id === form.accountId);
  const formCurrency = currencyOverride ?? selectedAccount?.currency;
  const fractionDigits = formCurrency
    ? currencyFractionDigits(formCurrency)
    : 2;

  const loadAccounts = useCallback(async () => {
    try {
      const items = await accountsApi.list();
      setAccounts(items);
      setForm((current) =>
        current.accountId ? current : newForm(items[0]?.id || ''),
      );
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(
        caught instanceof ApiError ? caught.message : tVal('loadError'),
      );
    } finally {
      setAccountsLoaded(true);
    }
  }, [router, tVal]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const loadTransactions = useCallback(async () => {
    const requestId = ++listVersion.current;
    setLoading(true);
    setError('');
    try {
      const response = await transactionsApi.list({
        page,
        limit: 10,
        accountId: accountFilter || undefined,
        type: (typeFilter as TransactionType) || undefined,
        category: categoryFilter.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });
      if (requestId !== listVersion.current) return;
      setTransactions(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (caught) {
      if (requestId !== listVersion.current) return;
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(
        caught instanceof ApiError ? caught.message : tVal('loadError'),
      );
    } finally {
      setLoading(false);
    }
  }, [
    accountFilter,
    categoryFilter,
    endDate,
    page,
    router,
    sortBy,
    sortOrder,
    startDate,
    tVal,
    typeFilter,
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTransactions(), 150);
    return () => window.clearTimeout(timeout);
  }, [loadTransactions]);

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    listVersion.current += 1;
    setError('');
    setNotice('');
    if (startDate && endDate && startDate > endDate) {
      setError(tVal('dateOrder'));
      return;
    }
    const currency =
      formCurrency ?? selectedAccount?.currency;
    if (!currency || !form.accountId) {
      setError(tVal('selectAccount'));
      return;
    }
    const amountMinor = parseAmountToMinorUnits(form.amount, currency);
    if (!amountMinor) {
      setError(tVal('enterAmount'));
      return;
    }
    if (!form.category.trim()) {
      setError(tVal('categoryRequired'));
      return;
    }
    if (!form.date || Number.isNaN(Date.parse(form.date))) {
      setError(tVal('dateRequired'));
      return;
    }

    const input: TransactionInput = {
      accountId: form.accountId,
      type: form.type,
      amountMinor,
      category: form.category.trim(),
      description: form.description.trim() ? form.description.trim() : undefined,
      date: form.date,
    };

    setSaving(true);
    try {
      if (editingId) {
        await transactionsApi.update(editingId, input);
        setNotice(t('transactionUpdated'));
      } else {
        await transactionsApi.create(input);
        setNotice(t('transactionCreated'));
      }
      setEditingId(null);
      setCurrencyOverride(null);
      setForm(newForm(accounts[0]?.id || ''));
      setPage(1);
      await loadTransactions();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : tVal('saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function remove(transaction: Transaction) {
    if (!window.confirm(t('deleteConfirm'))) {
      return;
    }
    listVersion.current += 1;
    setError('');
    setNotice('');
    try {
      await transactionsApi.remove(transaction.id);
      setNotice(t('transactionDeleted'));
      const nextPage =
        transactions.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      const response = await transactionsApi.list({
        page: nextPage,
        limit: 10,
        accountId: accountFilter || undefined,
        type: (typeFilter as TransactionType) || undefined,
        category: categoryFilter.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });
      setTransactions(response.items);
      setTotal(response.total);
      setTotalPages(response.totalPages);
      if (editingId === transaction.id) {
        setEditingId(null);
        setCurrencyOverride(null);
        setForm(newForm(accounts[0]?.id || ''));
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : tVal('deleteError'));
    }
  }

  function edit(transaction: Transaction) {
    setEditingId(transaction.id);
    setForm({
      accountId: transaction.accountId,
      type: transaction.type,
      amount: minorUnitsToInput(transaction.amountMinor, transaction.currency),
      category: transaction.category,
      description: transaction.description ?? '',
      date: transaction.date.slice(0, 10),
    });
    setCurrencyOverride(transaction.currency);
    setError('');
    setNotice('');
  }

  return (
    <section className="space-y-8">
      <form
        className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={save}
      >
        <div className="sm:col-span-2 lg:col-span-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingId ? t('editTransaction') : t('addTransaction')}
          </h2>
          {accountsLoaded && !accounts.length && (
            <p className="mt-1 text-sm text-amber-800">
              {t('needAccount')}
              <a className="underline" href="/accounts">
                {t('accountsPageLink')}
              </a>
              .
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="transaction-account"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('accountLabel')}
          </label>
          <select
            id="transaction-account"
            required
            value={form.accountId}
            onChange={(event) =>
              setForm({ ...form, accountId: event.target.value })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
            disabled={!accounts.length}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="transaction-type"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('typeLabel')}
          </label>
          <select
            id="transaction-type"
            value={form.type}
            onChange={(event) =>
              setForm({ ...form, type: event.target.value as TransactionType })
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900"
          >
            <option value="expense">{t('types.expense')}</option>
            <option value="income">{t('types.income')}</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="transaction-amount"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('amountLabel')} {formCurrency ? `(${formCurrency})` : ''}
          </label>
          <input
            id="transaction-amount"
            required
            inputMode="decimal"
            value={form.amount}
            onChange={(event) =>
              setForm({ ...form, amount: event.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
            placeholder={
              fractionDigits ? `0.${'0'.repeat(fractionDigits)}` : '0'
            }
          />
        </div>
        <div>
          <label
            htmlFor="transaction-category"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('categoryLabel')}
          </label>
          <input
            id="transaction-category"
            required
            maxLength={60}
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label
            htmlFor="transaction-date"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('dateLabel')}
          </label>
          <input
            id="transaction-date"
            type="date"
            required
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div>
          <label
            htmlFor="transaction-description"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {t('descriptionLabel')}
          </label>
          <input
            id="transaction-description"
            maxLength={500}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
          />
        </div>
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={saving || !accounts.length}
            className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {saving
              ? tCommon('saving')
              : editingId
                ? t('saveChangesBtn')
                : t('addTransactionBtn')}
          </button>
          {editingId && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditingId(null);
                setForm(newForm(accounts[0]?.id || ''));
                setCurrencyOverride(null);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700"
            >
              {tCommon('cancel')}
            </button>
          )}
        </div>
      </form>

      {error && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p className="text-sm text-green-800" role="status">
          {notice}
        </p>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {t('yourTransactions')}
            </h2>
            <p className="text-sm text-gray-600">{t('totalCount', { count: total })}</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-by" className="text-sm text-gray-700">
              {t('sortBy')}
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as TransactionSortField);
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="date">{t('sortFields.date')}</option>
              <option value="createdAt">{t('sortFields.createdAt')}</option>
              <option value="amountMinor">{t('sortFields.amountMinor')}</option>
            </select>
            <select
              aria-label="Sort order"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as 'asc' | 'desc');
                setPage(1);
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="desc">{t('sortOrder.desc')}</option>
              <option value="asc">{t('sortOrder.asc')}</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="filter-account"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              {t('filterAccount')}
            </label>
            <select
              id="filter-account"
              value={accountFilter}
              onChange={(event) =>
                changeFilter(setAccountFilter, event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm"
            >
              <option value="">{t('allAccounts')}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="filter-type"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              {t('filterType')}
            </label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(event) =>
                changeFilter(setTypeFilter, event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm"
            >
              <option value="">{t('allTypes')}</option>
              <option value="income">{t('types.income')}</option>
              <option value="expense">{t('types.expense')}</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="filter-category"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              {t('filterCategory')}
            </label>
            <input
              id="filter-category"
              value={categoryFilter}
              onChange={(event) =>
                changeFilter(setCategoryFilter, event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
              placeholder={t('exactCategory')}
            />
          </div>
          <div>
            <label
              htmlFor="filter-start"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              {t('filterFrom')}
            </label>
            <input
              id="filter-start"
              type="date"
              value={startDate}
              onChange={(event) =>
                changeFilter(setStartDate, event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="filter-end"
              className="mb-1 block text-xs font-medium text-gray-600"
            >
              {t('filterTo')}
            </label>
            <input
              id="filter-end"
              type="date"
              value={endDate}
              onChange={(event) => changeFilter(setEndDate, event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <p
            className="rounded-xl border border-gray-200 bg-white p-8 text-gray-600"
            role="status"
          >
            {t('loadingTransactions')}
          </p>
        ) : transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">
            {t('noMatching')}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[720px] divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3">{t('table.date')}</th>
                  <th className="px-4 py-3">{t('table.category')}</th>
                  <th className="px-4 py-3">{t('table.account')}</th>
                  <th className="px-4 py-3">{t('table.type')}</th>
                  <th className="px-4 py-3 text-right">{t('table.amount')}</th>
                  <th className="px-4 py-3">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {transaction.date.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {transaction.category}
                      </span>
                      {transaction.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">
                          {transaction.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {accounts.find(
                        (acc) => acc.id === transaction.accountId,
                      )?.name ?? t('table.account')}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">
                      {t(`types.${transaction.type}`)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right font-medium ${transaction.type === 'income' ? 'text-green-700' : 'text-gray-900'}`}
                    >
                      {formatMinorUnits(
                        transaction.amountMinor,
                        transaction.currency,
                        locale,
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        className="mr-3 font-medium text-emerald-800 hover:underline"
                        onClick={() => edit(transaction)}
                      >
                        {tCommon('edit')}
                      </button>
                      <button
                        className="font-medium text-red-700 hover:underline"
                        onClick={() => void remove(transaction)}
                      >
                        {tCommon('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            {t('previous')}
          </button>
          <p className="text-sm text-gray-600">
            {t('pageOf', { page: totalPages === 0 ? 0 : page, total: totalPages })}
          </p>
          <button
            disabled={page >= totalPages || loading || totalPages === 0}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            {t('next')}
          </button>
        </div>
      </section>
    </section>
  );
}
