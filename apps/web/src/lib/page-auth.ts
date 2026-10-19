import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError, getCurrentUserForServer } from './api';

export async function verifyPageSession(): Promise<boolean> {
  const token = cookies().get('fintrack_session')?.value;
  if (!token) redirect('/login');
  try {
    await getCurrentUserForServer(token);
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }
    return false;
  }
}
