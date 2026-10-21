export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type AccountType = 'checking' | 'savings' | 'cash' | 'other';
export type TransactionType = 'income' | 'expense';
export type TransactionSortField = 'date' | 'createdAt' | 'amountMinor';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountInput {
  name: string;
  type: AccountType;
  currency: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amountMinor: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionInput {
  accountId: string;
  type: TransactionType;
  amountMinor: number;
  category: string;
  description?: string;
  date: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: TransactionType;
  accountId?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: TransactionSortField;
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardCurrencySummary {
  currency: string;
  balanceMinor: number;
  incomeMinor: number;
  expenseMinor: number;
  netCashFlowMinor: number;
}

export interface DashboardSummary {
  period: { startDate: string; endDate: string };
  currencies: DashboardCurrencySummary[];
  monthly: Array<{
    month: string;
    currency: string;
    incomeMinor: number;
    expenseMinor: number;
  }>;
  expenseCategories: Array<{
    category: string;
    currency: string;
    amountMinor: number;
  }>;
  recentTransactions: Array<{
    id: string;
    accountId: string;
    accountName: string;
    type: TransactionType;
    amountMinor: number;
    currency: string;
    category: string;
    description: string;
    date: string;
  }>;
}

interface UserResponse {
  user: PublicUser;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Returns the base API URL.
 *
 * - In production the frontend uses a relative path (`/api`) so every
 *   browser request stays on the same origin. A Next.js rewrite proxies
 *   those requests to the real backend.
 * - In development the full URL is used (e.g. `http://localhost:3001/api`).
 */
function getApiUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configuredUrl) {
    throw new Error('NEXT_PUBLIC_API_URL must be set before building the frontend.');
  }
  return configuredUrl.replace(/\/+$/, '');
}

const API_URL = getApiUrl();

async function request<T>(
  path: string,
  init: RequestInit = {},
  baseUrl?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl ?? API_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError(
      'Unable to connect to FinTrack. Check that the API is running and try again.',
      0,
    );
  }

  const responseText = response.status === 204 ? '' : await response.text();
  let payload: unknown;
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = undefined;
    }
  }

  if (!response.ok) {
    throw new ApiError(getErrorMessage(response.status, payload), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  if (payload === undefined) {
    throw new ApiError('The server returned an invalid response.', response.status);
  }

  return payload as T;
}

function getErrorMessage(status: number, payload: unknown): string {
  if (status === 401) {
    return 'Invalid email or password.';
  }
  if (status >= 500) {
    return 'The service encountered an error. Please try again.';
  }
  if (status === 403) {
    return 'This request could not be verified. Refresh the page and try again.';
  }

  if (status === 404) {
    return 'The requested item could not be found.';
  }
  if (status === 400 || status === 409) {
    const message = getPayloadMessage(payload);
    if (message) {
      return message;
    }
  }

  return 'The request could not be completed. Please review your details and try again.';
}

function getPayloadMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null || !('message' in payload)) {
    return null;
  }

  const message = (payload as { message: unknown }).message;
  if (typeof message === 'string') {
    return message;
  }
  if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) {
    return message.join(' ');
  }
  return null;
}

export const authApi = {
  register(input: RegisterInput): Promise<UserResponse> {
    return request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  login(input: LoginInput): Promise<UserResponse> {
    return request<UserResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  getMe(): Promise<UserResponse> {
    return request<UserResponse>('/auth/me');
  },

  logout(): Promise<void> {
    return request<void>('/auth/logout', { method: 'POST' });
  },
};

export const accountsApi = {
  async list(): Promise<Account[]> {
    const response = await request<{ items: Account[] }>('/accounts');
    return response.items;
  },

  async create(input: AccountInput): Promise<Account> {
    const response = await request<{ account: Account }>('/accounts', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.account;
  },

  async update(id: string, input: Partial<AccountInput>): Promise<Account> {
    const response = await request<{ account: Account }>(
      `/accounts/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return response.account;
  },

  remove(id: string): Promise<void> {
    return request<void>(`/accounts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export const transactionsApi = {
  async list(filters: TransactionFilters = {}): Promise<TransactionPage> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    }
    const query = params.size ? `?${params.toString()}` : '';
    return request<TransactionPage>(`/transactions${query}`);
  },

  async create(input: TransactionInput): Promise<Transaction> {
    const response = await request<{ transaction: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return response.transaction;
  },

  async update(
    id: string,
    input: Partial<TransactionInput>,
  ): Promise<Transaction> {
    const response = await request<{ transaction: Transaction }>(
      `/transactions/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(input) },
    );
    return response.transaction;
  },

  remove(id: string): Promise<void> {
    return request<void>(`/transactions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};

export const dashboardApi = {
  getSummary(filters: Pick<TransactionFilters, 'startDate' | 'endDate'>): Promise<DashboardSummary> {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    return request<DashboardSummary>(`/dashboard/summary?${params.toString()}`);
  },
};

/**
 * Fetch the current user from the API using a server-side token.
 *
 * In production, `API_BACKEND_URL` is used to call the backend directly
 * (server-to-server), avoiding a round-trip through the rewrite proxy.
 * In development `API_BACKEND_URL` is not set, so the call falls back to
 * `NEXT_PUBLIC_API_URL` which points at the local API.
 */
export async function getCurrentUserForServer(
  token: string,
): Promise<PublicUser> {
  const serverUrl = process.env.API_BACKEND_URL?.trim()?.replace(/\/+$/, '');
  const response = await request<UserResponse>(
    '/auth/me',
    { headers: { Cookie: `fintrack_session=${token}` } },
    serverUrl || undefined,
  );
  return response.user;
}
