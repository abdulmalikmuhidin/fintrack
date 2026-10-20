# Security notes

This document describes the implemented controls and limitations; it is not a guarantee
that the application is secure or a substitute for a deployment-specific review.

## Implemented controls

- Passwords are hashed with bcryptjs (12 rounds) before persistence.
- Login returns the same generic unauthorized response for unknown users and incorrect
  passwords; unknown-user login performs a dummy bcrypt comparison.
- JWTs are held in an HttpOnly cookie, not localStorage. Cookies are SameSite=Lax, use
  Secure in production, and expire with the configured JWT lifetime.
- JWT signature and expiration are validated by Passport; the strategy resolves `sub` to
  an existing user.
- DTO validation runs globally with whitelist and non-whitelisted-field rejection.
- Finance services derive ownership from the verified identity and scope queries by user.
- CORS is restricted to `FRONTEND_URL`; state-changing routes validate request Origin.
- Password hashes are selected out of ordinary user queries and excluded from public
  response shapes. JWT secrets and MongoDB URIs are not public frontend configuration.
- Account/transaction consistency uses MongoDB transactions and an account counter.

## Limitations and follow-up

- The requested independent security-review agent could not be started because the
  Copilot review service was unavailable due to DNS resolution failure. No independent
  security audit findings are claimed in this milestone report.
- Frontend and API origin checks are appropriate for the documented same-site deployment;
  deployment host topology, reverse-proxy headers, TLS termination, and cookie behavior
  must be validated in the actual production environment.
- No rate limiting, account lockout, password reset/MFA, security headers policy, or
  centralized alerting is configured in this repository.
- The `/api/health` endpoint checks process liveness only, not database readiness.
- MongoDB credentials and JWT secrets must be rotated immediately if ever exposed. The
  repository's `.env*` ignore patterns are intended to keep local values out of Git; inspect
  repository history and hosting logs separately if exposure is suspected.
- Dependency audit results are advisory and can include transitive findings. Review
  `npm audit` output and apply compatible updates before deployment.

## Production release review

On October 20, 2026, `npm audit --omit=dev` reported zero critical, five high, eight
moderate, and one low production dependency advisories after updating the frontend to
Next.js `15.5.28`. The remaining high findings involve NestJS platform dependencies,
`multer`, `js-yaml`, `lodash`, and `postcss`; npm's suggested fixes require major framework
upgrades. This repository preparation does not include those migrations. Treat the
remaining high findings as a release blocker until they are fixed or an informed risk
acceptance is documented. Re-run the audit immediately before launch.

## Operational guidance

Use a least-privilege MongoDB user, restrict Atlas network access, use unique high-entropy
secrets per environment, require HTTPS in production, and never log passwords, tokens,
connection strings, or full request headers.
