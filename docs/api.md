# API reference

The API uses the `/api` global prefix. Swagger UI is exposed by the Nest application at
`/docs` (for local development: `http://localhost:3001/docs`). All request/response details
are generated from the current controllers and DTO metadata.

## Authentication

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Trusted `Origin` | Register; response contains public user only. |
| `POST` | `/api/auth/login` | Trusted `Origin` | Login; sets HttpOnly `fintrack_session` cookie. |
| `GET` | `/api/auth/me` | Session cookie | Return public profile. |
| `POST` | `/api/auth/logout` | Trusted `Origin` | Clear cookie; `204`. |

## Accounts

All account routes require the session cookie. `POST`, `PATCH`, and `DELETE` also require a
trusted Origin. Supported types: `checking`, `savings`, `cash`, `other`.

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/api/accounts` | Create (`name`, `type`, `currency`). |
| `GET` | `/api/accounts` | List current user's accounts. |
| `GET` | `/api/accounts/:id` | Get an owned account. |
| `PATCH` | `/api/accounts/:id` | Update allowed account fields only. |
| `DELETE` | `/api/accounts/:id` | Delete only with no transactions; `409` otherwise. |

## Transactions

All transaction routes require the session cookie. Mutations require a trusted Origin.
Money is an integer `amountMinor`, positive and at most `100000000000`; currency is
snapshotted from the owned account at create time.

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/api/transactions` | Create income/expense for an owned account. |
| `GET` | `/api/transactions` | List with `page`, `limit`, `type`, `accountId`, `category`, `startDate`, `endDate`, `sortBy`, `sortOrder`. |
| `GET` | `/api/transactions/:id` | Get one owned transaction. |
| `PATCH` | `/api/transactions/:id` | Update owned transaction and optionally reassign to owned account. |
| `DELETE` | `/api/transactions/:id` | Delete owned transaction; `204`. |

Pagination bounds: `page` 1–100,000; `limit` 1–100. Sort field allowlist: `date`,
`createdAt`, `amountMinor`. Date-only filters include the full UTC end date.

## Dashboard

`GET /api/dashboard/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` requires the session
cookie. Dates are inclusive UTC calendar days; omitted dates default to the current UTC
month. The response includes `period`, `currencies`, `monthly`, `expenseCategories`, and
`recentTransactions`. Values are integer minor units grouped by currency. `balanceMinor`
is all-time recorded income minus expenses; period totals and charts are bounded by the
requested dates. Category totals include expense transactions only.

## Error handling

DTO failures return `400`; missing/invalid sessions return `401`; rejected origins return
`403`; missing or unowned resources return `404`; duplicate registration and deletion of
accounts with transactions return `409`. Internal errors should not be treated as safe
client detail.
