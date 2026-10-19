import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          FinTrack
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          A clear, private place to organize accounts and track income and expenses.
        </p>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-emerald-900 mb-2">Your finances, organized</h2>
          <p className="text-emerald-900">
            Create accounts, record transactions, and review your financial activity with currency-aware summaries.
          </p>
        </div>
        <div className="mb-8 flex justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white hover:bg-emerald-800"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
          >
            Log in
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📊 Dashboard</h3>
            <p className="text-gray-600">Visualize your spending patterns and financial health</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">💰 Transactions</h3>
            <p className="text-gray-600">Track income and expenses with categories and tags</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📈 Dashboard</h3>
            <p className="text-gray-600">Review recorded income, expenses, and category breakdowns</p>
          </div>
        </div>
        <footer className="mt-12 text-sm text-gray-500">
          <p>FinTrack v1.0.0 - Built with Next.js, NestJS, and MongoDB</p>
        </footer>
      </div>
    </main>
  )
}