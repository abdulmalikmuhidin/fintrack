# Testing and quality checks

Run commands from the repository root after `npm ci`.

| Command | Scope |
| --- | --- |
| `npm test` | API Jest tests and frontend Jest/Testing Library tests. |
| `npm run test:api` | Backend unit tests. |
| `npm run test:web` | Frontend component/helper tests in jsdom. |
| `npm run test:coverage` | Coverage reports for API and frontend. |
| `npm run lint` | API ESLint and Next.js lint. |
| `npm run typecheck` | API and frontend TypeScript checks. |
| `npm run build` | Production builds for both applications. |

API test coverage includes configuration validation, registration/login behavior,
normalization and password hashing, user-scoped account and transaction operations,
transaction DTO validation/filtering, account deletion safeguards, health behavior, and
dashboard date/currency aggregation. Frontend tests cover login/register flows, logout,
dashboard loading/empty/error/session-expiry behavior, and currency-aware money helpers.

Coverage output is written to `apps/api/coverage` and `apps/web/coverage`; these directories
are ignored by Git. No global threshold is configured because current coverage is not yet
measured across all behavior and a repository-wide threshold would misrepresent untested
UI and infrastructure paths.

There is no browser-based E2E test suite or live MongoDB integration fixture in the current
repository. Unit tests use mocks and do not require production credentials. Finance
consistency relies on MongoDB transactions and should receive a dedicated replica-set
integration test before relying on those guarantees in production.

Do not use production database credentials in tests. Any future E2E fixture should use an
isolated throwaway database and always close app, connection, and test server resources.
