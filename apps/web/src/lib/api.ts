export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '') ??
  'http://localhost:3001/api';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
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

export async function getCurrentUserForServer(
  token: string,
): Promise<PublicUser> {
  const response = await request<UserResponse>('/auth/me', {
    headers: { Cookie: `fintrack_session=${token}` },
  });
  return response.user;
}
