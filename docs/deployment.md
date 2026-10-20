# Production deployment

This guide configures the existing npm-workspaces monorepo for a Vercel frontend and a
Render API. It does not represent a completed deployment; no production URLs or credentials
are available in this repository.

## Important cookie-domain requirement

The API sets the `fintrack_session` cookie as `HttpOnly`, `Secure` in production, and
`SameSite=Lax`. The browser API client sends credentials, the API restricts credentialed
CORS to `FRONTEND_URL`, and state-changing routes require an exact matching `Origin`.

Do not use the default `*.vercel.app` frontend together with `*.onrender.com` for
authenticated production use: these are different sites, and browsers may omit/block the
Lax cookie on cross-site `fetch` requests. Assign custom HTTPS domains under the same
registrable domain, for example `app.example.com` and `api.example.com`. The cookie is
host-only to the API host; no broad cookie `Domain` is configured. Set `FRONTEND_URL` to
the exact frontend origin, including scheme and any non-default port but no path.

If same-site custom domains cannot be used, stop before launch and choose a deliberate
architecture change. Changing to `SameSite=None` alone is not a reliable workaround because
browsers can block third-party cookies; such a change also requires keeping the origin-based
CSRF protection and validating browser behavior.

## Prerequisites

- Node.js `>=18.18.0` locally; the CI workflow uses Node 20.
- A GitHub repository containing the project and root `package-lock.json`.
- A MongoDB Atlas project and dedicated production database user.
- A Render Web Service and a Vercel project connected to the repository.
- Ownership of a domain configured for both services, with HTTPS enabled.
- A strong unique JWT secret generated for production.

Do not put production values in GitHub files, `.env.example`, client-side variables, or
commits. The API's local `apps/api/.env` is ignored; do not share its contents.

## Prepare GitHub

1. Confirm the intended source branch is pushed and review `git status` and the diff for
   accidental environment files, credentials, generated files, or test data.
2. Confirm the root `package-lock.json` is committed. This is the lockfile used by the npm
   workspaces.
3. Keep the existing CI workflow enabled. It runs `npm ci`, lint, type-check, unit tests,
   and both production builds.
4. Never add deployment credentials to the workflow. Hosting services should integrate
   directly with the repository and hold their environment values in their own dashboards.

### Dependency security gate

The production dependency audit run during this preparation (October 20, 2026) found zero
critical and five high-severity advisories after moving the frontend to the patched
Next.js `15.5.28` release. The remaining high findings include `@nestjs/platform-express`,
`multer`, `js-yaml`, `lodash`, and `postcss`; npm's suggested framework fixes require a
major upgrade to NestJS 12 and Next.js 16. Do not treat a passing build as a security
clearance or launch a public finance service while these findings remain unreviewed.
Plan and test the framework upgrades, or have a qualified reviewer assess the reachable
paths and explicitly accept the residual risk before public launch. Re-run
`npm audit --omit=dev` immediately before deployment because advisory data changes.

## MongoDB Atlas

1. Create or select a dedicated production database, separate from local and test data.
2. Create an application database user with only the `readWrite` role on that database.
   Do not use an Atlas project owner or admin account as the application user.
3. Copy the Atlas SRV connection string, replace its placeholders locally in the Render
   dashboard, and include the intended database name. URL-encode special characters in
   the username/password as required by MongoDB URI syntax.
4. Configure Atlas Network Access to admit the Render service's outbound traffic.
   Prefer static outbound IP addresses if the selected Render plan/service provides them,
   and allowlist only those addresses. Render outbound addresses can depend on the service
   and plan and must be confirmed in that service's dashboard; do not assume a fixed IP.
   If fixed addresses are unavailable, options include Render's supported private-network
   connectivity/peering where available, or a carefully assessed broader Atlas allowlist
   with a dedicated least-privilege DB user and strong credentials. A temporary `0.0.0.0/0`
   rule is broad exposure, not a secure fixed-IP restriction; avoid it where possible and
   remove it immediately if used for diagnosis.
5. Do not put the URI in frontend variables, logs, GitHub Actions, or public documentation.

The API's `/api/health` endpoint is a **liveness** check only. It does not query MongoDB.
Nest initializes the Mongoose connection before it begins listening; a database connection
failure prevents normal service startup. A healthy liveness response is not proof that
Atlas is ready to serve queries.

## Render API Web Service

Create a **Web Service** connected to the GitHub repository with these settings:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | Repository root (`.`); leave blank if Render treats blank as root |
| Build Command | `npm ci && npm run build:api` |
| Start Command | `npm --prefix apps/api run start:prod` |
| Health Check Path | `/api/health` |

The repository-root directory is important: npm workspaces and the committed root
`package-lock.json` are used for installation. `npm run build:api` builds the API to
`apps/api/dist/main.js`; the start command executes that generated production entry point.
The API listens on `0.0.0.0` and the `PORT` supplied by Render (defaulting to `3001` only for local use).

Set these Render environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Production Atlas SRV URI; secret |
| `JWT_SECRET` | Unique cryptographically random value, at least 32 characters; secret |
| `JWT_EXPIRES_IN_SECONDS` | Optional; integer from `300` to `86400`, defaults to `900` |
| `FRONTEND_URL` | Exact Vercel custom origin, e.g. `https://app.example.com` |
| `SWAGGER_ENABLED` | `false` unless the public Swagger UI is intentionally wanted |
| `PORT` | Leave unset; Render provides it |

Render's `NODE_ENV=production` makes the session cookie secure and requires `FRONTEND_URL`
to use HTTPS. Swagger is disabled by default in production. Setting `SWAGGER_ENABLED=true`
publishes the API schema/UI at `/docs`; it does not bypass endpoint authentication, but
should only be enabled intentionally.

After deployment, assign the API custom domain (e.g. `api.example.com`) in Render and wait
for its HTTPS certificate to be active. Update `FRONTEND_URL` to the actual frontend domain
and redeploy/restart the service after changing environment values.

## Vercel frontend

Create a Vercel project from the same repository:

| Setting | Value |
| --- | --- |
| Framework Preset | Next.js |
| Root Directory | `apps/web` |
| Include source files outside the Root Directory | Enabled |
| Install Command | `cd ../.. && npm ci` |
| Build Command | `npm run build` |
| Output Directory | Leave the Next.js default |

The install command runs from the selected project directory up to the repository root so
the workspace root lockfile and npm workspace dependencies are used. The build command
runs in `apps/web`.

Set `NEXT_PUBLIC_API_URL` for the **Production** environment before building, to the public
HTTPS API URL including the API prefix, for example `https://api.example.com/api`. This is
public browser configuration, not a secret. The app validates at production-build time
that it is HTTPS and ends in `/api`; the value is embedded in the client bundle during the
build. Set it separately for Preview/Development only if those environments have a usable
same-site API setup.

Assign the frontend custom domain (e.g. `app.example.com`) in Vercel and complete its DNS
and HTTPS setup. Then make sure Render's `FRONTEND_URL` exactly matches it. Redeploy the
frontend after changing `NEXT_PUBLIC_API_URL`.

## Local production build checks

Run from the repository root:

```powershell
npm ci
npm run lint
npm run typecheck
npm test
$env:NEXT_PUBLIC_API_URL = "https://api.example.com/api"
npm run build
Remove-Item Env:NEXT_PUBLIC_API_URL
```

The example URL above is a build-time placeholder, not a claim that a live API exists.
For a local API run, use local `.env` files and the documented development API URL.

## Post-deployment smoke tests

Use a new, non-sensitive test account and test data. Do not modify or delete existing user
records.

1. Open the frontend custom domain and confirm HTTPS is valid.
2. Request `https://<api-domain>/api/health`; expect HTTP 200 and
   `{"status":"ok","service":"fintrack-api"}`. This confirms liveness, not DB readiness.
3. Confirm Render logs show successful API startup and MongoDB connection without exposing
   environment values.
4. Register a new test user, log in, reload a protected page, and confirm session
   restoration through `/api/auth/me`.
5. Create an account and test transaction, verify dashboard totals, and log out. Confirm
   protected requests fail after logout.
6. In browser developer tools, verify API requests use HTTPS, include credentials, and
   have no CORS or cookie warnings. Check the session cookie is `HttpOnly`, `Secure`, and
   `SameSite=Lax`; JavaScript must not be able to read it.
7. Do not test cross-user access against real user data. If testing ownership, use two new
   test users and resources created specifically for that test, then remove only those
   test records through the app.
8. Confirm `/docs` is unavailable when `SWAGGER_ENABLED=false` and is enabled only if you
   intentionally set the flag to true.
9. Inspect the public frontend bundle and repository diff for accidental secret values.

## Troubleshooting and rollback

- **API fails before listening:** check Render startup logs for missing/invalid required
  environment settings and verify Atlas DNS/network access and the database user's role.
  Never paste a full connection URI into a public issue or log.
- **API health returns 200 but data requests fail:** liveness does not check database
  readiness; inspect sanitized API/Atlas connectivity errors and network allowlisting.
- **Login succeeds but subsequent requests are unauthenticated:** confirm both custom
  domains share the same registrable domain, HTTPS is active, frontend fetches use
  credentials, and `FRONTEND_URL` exactly matches the frontend origin.
- **CORS or origin rejection:** check the scheme, hostname, and port in `FRONTEND_URL`;
  do not add wildcard credentialed CORS.
- **Frontend calls localhost or the wrong API:** update Vercel's production
  `NEXT_PUBLIC_API_URL` including `/api`, then trigger a new frontend build/deployment.
- **Render cannot find the workspace or output:** verify the service root is repository
  root, install used root `package-lock.json`, and build output exists at
  `apps/api/dist/main.js`.
- **Rollback:** use Render/Vercel deployment history to restore the last known-good
  deployment. Revert environment changes separately when safe. Database schema/data
  migrations are not part of this setup; do not restore or delete production data as a
  routine rollback step.

## Deployment status

No Vercel or Render deployment has been performed or verified from this workspace. Add live
URLs to the README only after completing the smoke tests above.
