# FinTrack - Personal Finance Application

A full-stack personal finance application built with Next.js, NestJS, and MongoDB.

FinTrack currently supports cookie-authenticated user accounts, currency-specific
accounts and transactions, and a dashboard built from recorded financial activity.
Budgets, transfers, opening balances, and currency conversion are not implemented.

## 🏗️ Project Structure

```
fintrack/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # NestJS backend API
├── docs/             # Architecture, data model, security, and test notes
├── .github/workflows # GitHub Actions quality checks
├── package.json      # Root workspace configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account (or local MongoDB instance)
- A MongoDB deployment with replica-set/transaction support for finance writes

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fintrack
   ```

2. Install all dependencies:
   ```bash
   npm ci
   ```

3. Set up environment variables (keep local secrets out of Git):
   ```bash
   # Copy these templates only if you do not already have local env files.
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

4. Configure your environment variables:
   
   **Backend (apps/api/.env):**
   - `PORT` - API server port (default: 3001)
   - `MONGODB_URI` - Required MongoDB Atlas or local MongoDB connection string
   - `FRONTEND_URL` - Exact frontend origin allowed by CORS and auth origin checks
   - `JWT_SECRET` - Required random secret with at least 32 characters; never commit it
   - `JWT_EXPIRES_IN_SECONDS` - JWT and session-cookie lifetime (300–86400; default: 900)
   
   Generate a secret locally without adding it to source control:
   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```
   Put the generated value in `JWT_SECRET`. Use a separate random value for each environment.

   **Frontend (apps/web/.env.local):**
   - `NEXT_PUBLIC_API_URL` - Backend API base URL (development default: `http://localhost:3001/api`)

   The API sets a short-lived `HttpOnly`, `SameSite=Lax` cookie. The web and API may use
   different ports during development, but production deployments must use the same site
   (for example, `app.example.com` and `api.example.com`) and HTTPS. Auth POST requests
   require an `Origin` matching `FRONTEND_URL`.

   `MONGODB_URI` must point to a reachable database. The app intentionally does not silently
   switch to an in-memory database when Atlas is unreachable. Atlas network access must allow
   the API host, and the database user must have the minimum required database permissions.

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them individually:
```bash
# Backend only
npm run dev:api

# Frontend only
npm run dev:web
```

### Building

Build all applications:
```bash
npm run build
```

Build individual applications:
```bash
# Backend only
npm run build:api

# Frontend only
npm run build:web
```

### Verification

Run from the repository root:

```bash
npm test                 # API and frontend unit tests
npm run test:coverage    # Coverage reports for both applications
npm run lint             # API ESLint and Next.js lint
npm run typecheck        # API and frontend TypeScript checks
npm run build            # Production API and frontend builds
```

There is currently no configured browser E2E suite. Backend tests are isolated unit tests
and do not require MongoDB credentials. See [docs/testing.md](docs/testing.md) for scope,
coverage-report locations, and known gaps.

### API documentation

With the API running, Swagger UI is available at `http://localhost:3001/docs`; its
OpenAPI operations are generated from the actual NestJS controllers and DTOs. Protected
operations use the `fintrack_session` cookie.

### Deployment preparation

- Configure real `MONGODB_URI`, `JWT_SECRET`, and `FRONTEND_URL` values in the deployment
  environment. Never put secrets in source control or `NEXT_PUBLIC_*`.
- Use HTTPS and a same-site frontend/API host arrangement for the cookie session.
- Allow the API's outbound network in MongoDB Atlas and use a least-privilege database user.
- Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before
  releasing. This repository has no deployment workflow.

### Production

Start production builds:
```bash
# Backend
cd apps/api && npm run start:prod

# Frontend
cd apps/web && npm run start
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:api` | Start backend in development mode |
| `npm run dev:web` | Start frontend in development mode |
| `npm run build` | Build all applications |
| `npm run build:api` | Build backend |
| `npm run build:web` | Build frontend |
| `npm run lint` | Lint all applications |
| `npm run test` | Run tests for all applications |
| `npm run test:coverage` | Generate API and frontend coverage reports |
| `npm run lint` | Run API ESLint and Next.js lint |
| `npm run typecheck` | Type-check both applications |
| `npm run install:all` | Install dependencies for all workspaces |

## 🌐 Environment Variables

### Backend (apps/api/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 3001 |
| `MONGODB_URI` | MongoDB connection string | Required |
| `FRONTEND_URL` | Frontend origin for CORS | http://localhost:3000 |

### Frontend (apps/web/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | http://localhost:3001/api |

The API also validates `JWT_SECRET` and `JWT_EXPIRES_IN_SECONDS` at startup. The example
files use placeholders only; generate independent strong secrets for each environment.

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Returns API status
  ```json
  {
    "status": "ok",
    "service": "fintrack-api"
  }
  ```
  **Note:** This endpoint checks API liveness only, not database connectivity.

### Authentication
- `POST /api/auth/register` - Create an account and return its public profile
- `POST /api/auth/login` - Verify credentials and set the HttpOnly session cookie
- `GET /api/auth/me` - Return the authenticated user's public profile
- `POST /api/auth/logout` - Clear the session cookie

The browser sends the cookie with credentialed requests. JWTs are not exposed to frontend
JavaScript or stored in localStorage. Passwords are hashed with bcryptjs before persistence.

### Accounts and transactions

All finance endpoints require the authenticated `fintrack_session` cookie. Account and
transaction ownership always comes from the verified JWT user; clients cannot set `userId`.

- `POST /api/accounts` — create an account (`name`, `type`, `currency`)
- `GET /api/accounts` — list the signed-in user's accounts
- `GET /api/accounts/:id` — retrieve an owned account
- `PATCH /api/accounts/:id` — update an owned account's name, type, or currency
- `DELETE /api/accounts/:id` — delete an owned account only when it has no transactions
- `POST /api/transactions` — create an income or expense
- `GET /api/transactions` — list the signed-in user's transactions with filtering and pagination
- `GET /api/transactions/:id` — retrieve an owned transaction
- `PATCH /api/transactions/:id` — update an owned transaction
- `DELETE /api/transactions/:id` — delete an owned transaction
- `GET /api/dashboard/summary` — get an authenticated, currency-separated financial summary

Supported account types are `checking`, `savings`, `cash`, and `other`. Currency uses an
uppercase three-letter ISO 4217 code. Transaction types are `income` and `expense`.

Money is stored and returned as a positive integer `amountMinor`, never as a floating-point
amount. The account's ISO currency determines its minor-unit precision (for example, USD 1234
means $12.34; JPY 1234 means ¥1,234). The API accepts between 1 and 100,000,000,000 minor units.
Transactions store the currency used when created; changing an account's currency or
reassigning a transaction does not reinterpret historical amounts. The UI uses the stored
transaction currency when editing and displaying an existing transaction.

Example transaction request:

```json
{
  "accountId": "65aa00000000000000000001",
  "type": "expense",
  "amountMinor": 1299,
  "category": "Food",
  "description": "Lunch",
  "date": "2026-10-19"
}
```

Transaction responses include `id`, `accountId`, `type`, `amountMinor`, `currency`,
`category`, `description`, `date`, `createdAt`, and `updatedAt`. List responses include
`items`, `total`, `page`, `limit`, and `totalPages`. `GET /api/transactions` supports
`page`, `limit` (maximum 100), `type`, `accountId`, `category`, `startDate`, `endDate`,
`sortBy` (`date`, `createdAt`, or `amountMinor`), and `sortOrder` (`asc` or `desc`).
Date-only range endpoints include the full UTC day. Results default to newest transaction
date first.

Account deletion returns `409 Conflict` when transactions remain. Transaction creation,
reassignment, deletion, and account deletion use MongoDB transactions and an account-side
transaction counter so concurrent operations cannot leave dangling account references.
This requires a MongoDB deployment with transaction support (MongoDB Atlas provides it).

### Dashboard summary

`GET /api/dashboard/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` requires the
authenticated session cookie. Both dates are inclusive UTC calendar dates; if omitted,
the endpoint uses the current UTC calendar month. Invalid dates and reversed ranges are
rejected.

The response includes:

```json
{
  "period": { "startDate": "2026-10-01", "endDate": "2026-10-31" },
  "currencies": [
    {
      "currency": "USD",
      "balanceMinor": 12500,
      "incomeMinor": 8000,
      "expenseMinor": 2500,
      "netCashFlowMinor": 5500
    }
  ],
  "monthly": [
    {
      "month": "2026-10",
      "currency": "USD",
      "incomeMinor": 8000,
      "expenseMinor": 2500
    }
  ],
  "expenseCategories": [
    { "category": "Food", "currency": "USD", "amountMinor": 2500 }
  ],
  "recentTransactions": []
}
```

All summary values use integer minor units, matching transaction storage, and are returned
separately for each ISO 4217 currency; currencies are never added together. `incomeMinor`,
`expenseMinor`, and `netCashFlowMinor` cover only the requested reporting period.
`balanceMinor` is the all-time net of recorded income and expenses. It is a tracked balance,
not a bank balance: opening balances and transfers are not modeled. Monthly chart data and
expense category totals cover only the selected period; recent transactions are the latest
eight owned records, irrespective of the selected period. Category totals include only
expense transactions. The dashboard uses a default current-UTC-month view and supports
last month, last three months, current year, and custom date ranges.

All aggregation pipelines are scoped to the verified user ID. Recent transaction account
names are joined only to accounts with the same owner. The transaction indexes support
user/date reports, date/type/category expense reports, and the existing account/category
listing patterns. The API rejects aggregation totals that exceed JavaScript's safe integer
range rather than returning an imprecise financial value.

## 🛠️ Technology Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React 18
- Recharts for responsive dashboard charts

### Backend
- NestJS 10
- TypeScript
- Mongoose (MongoDB ODM)
- @nestjs/config for configuration

### Database
- MongoDB Atlas / MongoDB

## 📝 Development Notes

- The health endpoint (`/api/health`) only checks API liveness, not database connectivity
- CORS and auth POST origin checks use the frontend origin specified in `FRONTEND_URL`
- Global API prefix is set to `/api`
- Environment variables are loaded and validated via `@nestjs/config`
- The API requires `MONGODB_URI` and a strong `JWT_SECRET` at startup
- Swagger UI is served at `/docs` by the API
- See [docs/architecture.md](docs/architecture.md), [docs/database-design.md](docs/database-design.md),
  [docs/api.md](docs/api.md), [docs/security.md](docs/security.md), and
  [docs/testing.md](docs/testing.md) for implementation details

## 🔒 Security

- Never commit `.env` files to version control
- Use strong passwords for MongoDB connections
- Keep dependencies updated
- Authentication uses short-lived HttpOnly JWT cookies; see [docs/security.md](docs/security.md)
  for design and limitations

## 📄 License

This project is licensed under the MIT License.