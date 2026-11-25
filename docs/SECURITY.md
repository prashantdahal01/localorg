# LocalOrg Security

## Controls

- Passwords are bcrypt-hashed and never stored or returned in plaintext.
- Email addresses are normalized to lowercase and unique.
- Access and refresh tokens are HttpOnly cookies with SameSite protection.
- Refresh tokens rotate and are server-revocable.
- JWT issuer, audience, signature, and expiry are validated.
- Login attempts use rate limiting, failed-attempt tracking, and temporary lockout.
- Password reset and activation tokens are cryptographically random, hashed at rest,
  expiring, and single-use.
- Helmet security headers and credentialed, origin-restricted CORS are enabled.
- Zod validates authentication request bodies.
- Audit events record authentication outcomes without passwords or raw tokens.
- Generic login and password-reset responses reduce account enumeration.
- Backend role and permission middleware protects APIs independently of the UI.

## Secret handling

Secrets belong in `api/.env`, which is ignored by Git. `.env.example` contains
placeholders only. Passwords, JWT secrets, MongoDB URIs, refresh tokens, activation
tokens, and reset tokens must not be logged.

## Testing

```powershell
npm test --prefix api
npm test --prefix web
npm run build --prefix web
```

Authentication integration tests require a separate test database and isolated
test data. The current unit tests cover profile sanitization and cookie/token
helpers without modifying Atlas data. Integration setup refuses to run unless
`TEST_MONGO_URI` targets `localorg_test` or a clearly suffixed test database.

## Phase 3.5 verification

An isolated `localorg_test` Atlas database was used for non-destructive
authentication verification. Twenty-one scenarios passed, including generic
credential errors, hashed and single-use activation/reset tokens, admin/member
RBAC, refresh-token rotation and reuse rejection, password-change session
revocation, logout, and audit-event creation. Test records were uniquely tagged
and only those records were removed.

No passwords, JWTs, cookies, activation tokens, reset tokens, or database
credentials were printed. The primary administrator and primary database were
not modified. Browser-level authentication automation remains a follow-up item,
and Atlas connectivity should be rechecked before production rollout because
prior network behavior was intermittent.

Phase 4 member-management routes are administrator-only, use explicit update
allowlists, validate identifiers, and do not expose emergency contacts, notes,
passwords, or activation tokens to member users. Membership statuses other than
`ACTIVE` are rejected by member portal authentication while administrators retain
historical access.

Initial membership payment routes are role-protected on the backend. Members can
only read the payment records associated with their authenticated `User.member`;
they cannot record, verify, reject, or change payment state. Rejection requires a
reason, verification records the administrator and timestamp, and all payment
state changes create audit events. Required amounts are integer NPR values stored
on each payment, so changing the setting cannot rewrite historical records.

New member accounts use cryptographically generated temporary credentials,
bcrypt hashes, and a mandatory first-password-change flag. Temporary passwords
are sent only through configured SMTP and are never returned, logged, or stored
in invitation state. Member APIs are rejected server-side while setup is
required, and invitation retries invalidate the previous credential.
