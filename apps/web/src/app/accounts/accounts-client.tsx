'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Account,
  AccountInput,
  AccountType,
  ApiError,
  accountsApi,
} from '../../lib/api';

const ACCOUNT_TYPES: { value: AccountType; key: 'checking' | 'savings' | 'cash' | 'other' }[] = [
  { value: 'checking', key: 'checking' },
  { value: 'savings', key: 'savings' },
  { value: 'cash', key: 'cash' },
  { value: 'other', key: 'other' },
];

const emptyForm: AccountInput = { name: '', type: 'checking', currency: 'USD' };

export default function AccountsClient() {
  const router = useRouter();
  const t = useTranslations('accounts');
  const tCommon = useTranslations('common');
  const tVal = useTranslations('accounts.validation');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState<AccountInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const loadVersion = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++loadVersion.current;
    setLoading(true);
    setError('');
    try {
      const nextAccounts = await accountsApi.list();
      if (requestId !== loadVersion.current) {
        return;
      }
      setAccounts(nextAccounts);
    } catch (caught) {
      if (requestId !== loadVersion.current) {
        return;
      }
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : tVal('loadError'));
    } finally {
      setLoading(false);
    }
  }, [router, tVal]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadVersion.current += 1;
    setError('');
    setNotice('');
    const cleaned = {
      name: form.name.trim(),
      type: form.type,
      currency: form.currency.trim().toUpperCase(),
    };
    if (!cleaned.name || cleaned.name.length > 100) {
      setError(tVal('nameRequired'));
      return;
    }
    if (!/^[A-Z]{3}$/.test(cleaned.currency)) {
      setError(tVal('currencyRequired'));
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await accountsApi.update(editingId, cleaned);
        setAccounts((previous) => previous.map((account) => (account.id === updated.id ? updated : account)));
        setNotice(t('accountUpdated'));
      } else {
        const created = await accountsApi.create(cleaned);
        setAccounts([created]);
        setNotice(t('accountCreated'));
      }
      setLoading(false);
      setForm(emptyForm);
      setEditingId(null);
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

  function edit(account: Account) {
    setEditingId(account.id);
    setForm({ name: account.name, type: account.type, currency: account.currency });
    setError('');
    setNotice('');
  }

  async function remove(account: Account) {
    if (!window.confirm(t('deleteConfirm', { name: account.name }))) {
      return;
    }
    loadVersion.current += 1;
    setError('');
    setNotice('');
    try {
      await accountsApi.remove(account.id);
      setAccounts((previous) => previous.filter((item) => item.id !== account.id));
      setNotice(t('accountDeleted'));
      setLoading(false);
      if (editingId === account.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace('/login');
        return;
      }
      setError(caught instanceof ApiError ? caught.message : tVal('deleteError'));
    }
  }

  return (
    <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{t('yourAccounts')}</h2>
        {loading && accounts.length === 0 && !notice ? (
          <p className="mt-4 text-gray-600" aria-live="polite" aria-busy="true">{t('loadingAccounts')}</p>
        ) : error && accounts.length === 0 ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p role="alert">{error}</p>
            <button className="mt-2 font-semibold underline" onClick={() => void load()}>{tCommon('tryAgain')}</button>
          </div>
        ) : accounts.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">
            {t('noAccounts')}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {accounts.map((account) => (
              <li key={account.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5">
                <div>
                  <h3 className="font-semibold text-gray-900">{account.name}</h3>
                  <p className="mt-1 text-sm capitalize text-gray-600">
                    {t(`types.${account.type}`)} · {account.currency}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="text-sm font-medium text-emerald-800 hover:underline" onClick={() => edit(account)}>{tCommon('edit')}</button>
                  <button className="text-sm font-medium text-red-700 hover:underline" onClick={() => void remove(account)}>{tCommon('delete')}</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {error && accounts.length > 0 && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>
        )}
        {notice && <p className="mt-4 text-sm text-green-800" role="status" aria-live="polite">{notice}</p>}
      </div>

      <form className="h-fit space-y-4 rounded-xl border border-gray-200 bg-white p-5" onSubmit={save}>
        <h2 className="text-lg font-semibold text-gray-900">{editingId ? t('editAccount') : t('addAccount')}</h2>
        <div>
          <label htmlFor="account-name" className="mb-1 block text-sm font-medium text-gray-700">{t('nameLabel')}</label>
          <input id="account-name" required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" />
        </div>
        <div>
          <label htmlFor="account-type" className="mb-1 block text-sm font-medium text-gray-700">{t('typeLabel')}</label>
          <select id="account-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as AccountType })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900">
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {t(`types.${type.key}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="account-currency" className="mb-1 block text-sm font-medium text-gray-700">{t('currencyLabel')}</label>
          <input id="account-currency" required minLength={3} maxLength={3} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase text-gray-900" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
            {saving ? tCommon('saving') : editingId ? t('saveChangesBtn') : t('addAccountBtn')}
          </button>
          {editingId && (
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700"
            >
              {tCommon('cancel')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
