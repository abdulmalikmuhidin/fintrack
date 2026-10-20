'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Account,
  ApiError,
  Transaction,
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

interface TransactionForm {
  accountId: string;
  type: TransactionType;
  amount: string;
  category: string;
  description: string;
  date: string;
}

const newForm = (accountId = ''): TransactionForm => ({
  accountId,
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  date: new Date().toISOString().slice(0, 10),
});

export default function TransactionsClient() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<TransactionSortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [form, setForm] = useState<TransactionForm>(newForm());
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === form.accountId),
    [accounts, form.accountId],
  );
  const formCurrency = currencyOverride ?? selectedAccount?.currency;
  const fractionDigits = formCurrency
    ? currencyFractionDigits(formCurrency)
    : 2;

  const loadAccounts = useCallback(async () => {
    try {
      const result = await accountsApi.list();
      setAccounts(result);
      setForm((previous) => ({
        ...previous,
        accountId: previous.accountId || result[0]?.id || '',
      }));
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : 'Unable to load accounts.');
    }
  }, [router]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    transactionsApi
      .list({
        page,
        limit,
        type: typeFilter ? (typeFilter as TransactionType) : undefined,
        accountId: accountFilter || undefined,
        category: categoryFilter.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      })
      .then((result) => {
        if (cancelled) return;
        setTransactions(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace('/login');
          return;
        }
        setError(caught instanceof ApiError ? caught.message : 'Unable to load transactions.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    accountFilter,
    categoryFilter,
    endDate,
    limit,
    page,
    router,
    sortBy,
    sortOrder,
    startDate,
    typeFilter,
  ]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!selectedAccount) {
      setError('Create an account before adding a transaction.');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setError('The start date must be before or equal to the end date.');
      return;
    }
    const amountMinor = parseAmountToMinorUnits(form.amount, formCurrency ?? selectedAccount.currency);
    if (amountMinor === null) {
      setError(`Enter a positive amount with no more than ${fractionDigits} decimal places (maximum 100,000,000,000 minor units).`);
      return;
    }
    if (!form.category.trim() || form.category.trim().length > 60) {
      setError('Enter a category between 1 and 60 characters.');
      return;
    }
    if (!form.date || Number.isNaN(Date.parse(form.date))) {
      setError('Enter a valid transaction date.');
      return;
    }

    setSaving(true);
    try {
      const input = {
        accountId: form.accountId,
        type: form.type,
        amountMinor,
        category: form.category.trim(),
        description: form.description.trim(),
        date: form.date,
      };
      if (editingId) {
        await transactionsApi.update(editingId, input);
        setNotice('Transaction updated.');
      } else {
        await transactionsApi.create(input);
        setNotice('Transaction created.');
      }
      setForm(newForm(accounts[0]?.id || ''));
      setCurrencyOverride(null);
      setEditingId(null);
      setPage(1);
      await loadAccounts();
      await reloadTransactions(1);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : 'Unable to save this transaction.');
    } finally {
      setSaving(false);
    }
  }

  async function reloadTransactions(requestedPage = page) {
    try {
      const result = await transactionsApi.list({
        page: requestedPage,
        limit,
        type: typeFilter ? (typeFilter as TransactionType) : undefined,
        accountId: accountFilter || undefined,
        category: categoryFilter.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
      });
      if (
        result.items.length === 0 &&
        requestedPage > 1 &&
        result.totalPages < requestedPage
      ) {
        setPage(Math.max(1, result.totalPages));
        return;
      }
      setTransactions(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : 'Unable to reload transactions.');
    }
  }

  function edit(transaction: Transaction) {
    setEditingId(transaction.id);
    setForm({
      accountId: transaction.accountId,
      type: transaction.type,
      amount: minorUnitsToInput(transaction.amountMinor, transaction.currency),
      category: transaction.category,
      description: transaction.description,
      date: transaction.date.slice(0, 10),
    });
    setCurrencyOverride(transaction.currency);
    setError('');
    setNotice('');
  }

  async function remove(transaction: Transaction) {
    if (!window.confirm(`Delete the ${transaction.type} transaction "${transaction.category}"?`)) return;
    setError('');
    setNotice('');
    try {
      await transactionsApi.remove(transaction.id);
      if (editingId === transaction.id) {
        setEditingId(null);
        setForm(newForm(accounts[0]?.id || ''));
        setCurrencyOverride(null);
      }
      setNotice('Transaction deleted.');
      await reloadTransactions();
      await loadAccounts();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : 'Unable to delete this transaction.');
    }
  }

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <section className="mt-8 space-y-8">
      <form className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(event) => void save(event)}>
        <div className="sm:col-span-2 lg:col-span-3">
          <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit transaction' : 'Add a transaction'}</h2>
          {accounts.length === 0 && <p className="mt-1 text-sm text-amber-800">You need an account before recording a transaction. Add one on the <a className="underline" href="/accounts">Accounts page</a>.</p>}
        </div>
        <div>
          <label htmlFor="transaction-account" className="mb-1 block text-sm font-medium text-gray-700">Transaction account</label>
          <select id="transaction-account" required value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900" disabled={!accounts.length}>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} ({account.currency})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="transaction-type" className="mb-1 block text-sm font-medium text-gray-700">Transaction type</label>
          <select id="transaction-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TransactionType })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900">
            <option value="expense">Expense</option><option value="income">Income</option>
          </select>
        </div>
        <div>
          <label htmlFor="transaction-amount" className="mb-1 block text-sm font-medium text-gray-700">Amount {formCurrency ? `(${formCurrency})` : ''}</label>
          <input id="transaction-amount" required inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" placeholder={fractionDigits ? `0.${'0'.repeat(fractionDigits)}` : '0'} />
        </div>
        <div>
          <label htmlFor="transaction-category" className="mb-1 block text-sm font-medium text-gray-700">Transaction category</label>
          <input id="transaction-category" required maxLength={60} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" />
        </div>
        <div>
          <label htmlFor="transaction-date" className="mb-1 block text-sm font-medium text-gray-700">Transaction date</label>
          <input id="transaction-date" type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" />
        </div>
        <div>
          <label htmlFor="transaction-description" className="mb-1 block text-sm font-medium text-gray-700">Description (optional)</label>
          <input id="transaction-description" maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" />
        </div>
        <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
          <button type="submit" disabled={saving || !accounts.length} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add transaction'}</button>
          {editingId && <button type="button" disabled={saving} onClick={() => { setEditingId(null); setForm(newForm(accounts[0]?.id || '')); setCurrencyOverride(null); }} className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700">Cancel</button>}
        </div>
      </form>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}
      {notice && <p className="text-sm text-green-800" role="status">{notice}</p>}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Your transactions</h2>
            <p className="text-sm text-gray-600">{total} total</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-by" className="text-sm text-gray-700">Sort</label>
            <select id="sort-by" value={sortBy} onChange={(event) => { setSortBy(event.target.value as TransactionSortField); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm">
              <option value="date">Date</option><option value="createdAt">Created</option><option value="amountMinor">Amount</option>
            </select>
            <select aria-label="Sort order" value={sortOrder} onChange={(event) => { setSortOrder(event.target.value as 'asc' | 'desc'); setPage(1); }} className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm">
              <option value="desc">Newest / highest</option><option value="asc">Oldest / lowest</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="filter-account" className="mb-1 block text-xs font-medium text-gray-600">Filter account</label>
            <select id="filter-account" value={accountFilter} onChange={(event) => changeFilter(setAccountFilter, event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm">
              <option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-type" className="mb-1 block text-xs font-medium text-gray-600">Filter type</label>
            <select id="filter-type" value={typeFilter} onChange={(event) => changeFilter(setTypeFilter, event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm">
              <option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-category" className="mb-1 block text-xs font-medium text-gray-600">Filter category</label>
            <input id="filter-category" value={categoryFilter} onChange={(event) => changeFilter(setCategoryFilter, event.target.value)} className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm" placeholder="Exact category" />
          </div>
          <div>
            <label htmlFor="filter-start" className="mb-1 block text-xs font-medium text-gray-600">Filter from</label>
            <input id="filter-start" type="date" value={startDate} onChange={(event) => changeFilter(setStartDate, event.target.value)} className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="filter-end" className="mb-1 block text-xs font-medium text-gray-600">Filter to</label>
            <input id="filter-end" type="date" value={endDate} onChange={(event) => changeFilter(setEndDate, event.target.value)} className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm" />
          </div>
        </div>

        {loading ? (
          <p className="rounded-xl border border-gray-200 bg-white p-8 text-gray-600" role="status">Loading transactions…</p>
        ) : transactions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No transactions match these filters. Add a transaction or adjust the filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full min-w-[720px] divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Type</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{transaction.date.slice(0, 10)}</td>
                    <td className="px-4 py-3"><span className="font-medium text-gray-900">{transaction.category}</span>{transaction.description && <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">{transaction.description}</p>}</td>
                    <td className="px-4 py-3 text-gray-700">{accounts.find((account) => account.id === transaction.accountId)?.name ?? 'Account'}</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{transaction.type}</td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${transaction.type === 'income' ? 'text-green-700' : 'text-gray-900'}`}>{formatMinorUnits(transaction.amountMinor, transaction.currency)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><button className="mr-3 font-medium text-emerald-800 hover:underline" onClick={() => edit(transaction)}>Edit</button><button className="font-medium text-red-700 hover:underline" onClick={() => void remove(transaction)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50">Previous</button>
          <p className="text-sm text-gray-600">Page {totalPages === 0 ? 0 : page} of {totalPages}</p>
          <button disabled={page >= totalPages || loading || totalPages === 0} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 disabled:opacity-50">Next</button>
        </div>
      </section>
    </section>
  );
}
