import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError, getCurrentUserForServer, PublicUser } from './api';

export async function verifyPageSession(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('fintrack_session')?.value;
  if (!token) redirect('/login');
  try {
    return await getCurrentUserForServer(token);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }
    return null;
  }
}
