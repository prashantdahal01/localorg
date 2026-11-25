# LocalOrg Authentication

## Architecture

LocalOrg uses short-lived JWT access tokens and rotating, server-revocable refresh
sessions. Both tokens are stored in HttpOnly, SameSite=strict cookies; tokens are
never placed in localStorage. Refresh sessions store only a SHA-256 hash of the
refresh token.

Roles are validated on the API. `ADMIN` users receive all permissions; `MEMBER`
users receive only their member-scoped permissions. Frontend route guards improve
UX but are not the authorization boundary.

## Initial administrator

There is no public administrator registration. Set these temporary environment
variables in `api/.env`:

```env
INITIAL_ADMIN_NAME=First Administrator
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PHONE=
INITIAL_ADMIN_PASSWORD=Use-a-strong-password1
```

Run once from the repository root:

```powershell
npm run bootstrap:admin --prefix api
```

The command refuses to run when any administrator already exists. Remove the
temporary bootstrap values after successful setup.

## Member activation

An authenticated administrator calls `POST /api/auth/activate-member` with an
existing `memberId` and email. The API creates a pending member account and a
single-use, expiring activation token. In development only, set
`DEV_AUTH_TOKENS=true` to receive the token in the response. Production never
returns or logs activation tokens.

The member completes activation with `POST /api/auth/activate` using the token
and a new password.

## API endpoints

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/activate-member` (ADMIN)
- `POST /api/auth/activate`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password` (authenticated)

## Frontend routes

- `/login`
- `/activate?token=...`
- `/forgot-password`
- `/reset-password?token=...`

Protected admin and member routes restore the session before rendering content.

Authentication integration tests require a separate `TEST_MONGO_URI` targeting
`localorg_test` (or a clearly suffixed test database). The harness refuses missing
or non-test database names and never falls back to `MONGO_URI`.

## Phase 3.5 verification

An isolated Atlas database named `localorg_test` was verified without changing
the primary database or administrator account. The end-to-end verification
passed 21 scenarios covering administrator and member login, activation,
role-based access, refresh rotation and reuse rejection, password reset and
change session invalidation, logout, token hashing, and audit events.

The standard backend tests, frontend tests, frontend production build, backend
syntax checks, and live health probe also passed. The permanent integration
harness still refuses to run unless `TEST_MONGO_URI` is explicitly configured;
the completed verification used an in-memory derived test URI and deleted only
its uniquely tagged test records.
# Member account provisioning

New member registration requires an email address and creates one linked pending
`MEMBER` account without generating or emailing credentials. After the initial
payment is verified, an administrator must explicitly approve the member and
then send the invitation. Only then is a cryptographically generated temporary
password created; only its hash is stored. SMTP delivery failures leave the
member and account intact with `FAILED` status so an administrator can retry.

The account remains `PENDING` until the initial membership contribution is
verified. Verification activates both the member and eligible account. A
successful temporary-password login sets `mustChangePassword`; the backend
blocks all member APIs except `/api/auth/me` and `/api/auth/change-password`
until the password is changed. The frontend redirects to
`/member/change-password` for the same state.
