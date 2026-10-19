import Link from 'next/link';
import LogoutButton from './dashboard/logout-button';

export default function FinanceNav() {
  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
      <Link className="text-blue-700 hover:underline" href="/dashboard">Dashboard</Link>
      <Link className="text-blue-700 hover:underline" href="/accounts">Accounts</Link>
      <Link className="text-blue-700 hover:underline" href="/transactions">Transactions</Link>
      <LogoutButton />
    </nav>
  );
}
