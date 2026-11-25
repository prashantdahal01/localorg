# LocalOrg Member Management

## Scope

Phase 4 provides administrator-only member registration, search, pagination,
profile editing, status management, activity history, and live dashboard
membership counts. Savings, loans, repayments, accounting, and financial
calculations remain out of scope.

## Data model

`Member` stores the member profile and membership lifecycle. `User.member`
optionally references one member record; a member may exist without a login
account. Passwords and authentication tokens are never stored in `Member`.

The immutable `memberId` uses `LOC-YYYY-NNNN`. A yearly `MemberCounter` document
is incremented atomically, and the unique member index prevents duplicates
during concurrent registration. IDs are not reused by status changes.

Membership statuses are `ACTIVE`, `INACTIVE`, `SUSPENDED`, and `ARCHIVED`.
Only `ACTIVE` members can authenticate to the member portal. Administrators
retain access to historical records for every status.

## API

All endpoints require an authenticated `ADMIN`:

- `GET /api/members` — server-side search, filters, sorting, and pagination.
- `POST /api/members` — register a member.
- `GET /api/members/:id` — retrieve a profile.
- `PATCH /api/members/:id` — update permitted profile fields.
- `PATCH /api/members/:id/status` — change membership status.
- `GET /api/members/:id/activity` — retrieve recent audit activity.
- `GET /api/members/summary` — live status counts for the admin dashboard.

Search covers name, member ID, phone, and email. Duplicate phone and email
values return `409`; email is optional, while phone is required.

## Security and audit

Member routes enforce API-side admin authorization, validate ObjectIds, use
explicit update allowlists, and never accept member IDs from the frontend.
Registration, edits, status changes, and activation initiation produce audit
events. Member profile responses do not include passwords, tokens, or financial
data.

## Testing

The isolated runtime probe passed member creation, generated ID validation,
search/pagination, status changes, summary aggregation, and activity retrieval
against `localorg_test`. It created and removed only uniquely tagged test
records. The permanent integration harness remains opt-in through
`TEST_MONGO_URI`.

Known limitation: browser-level member-management automation and a permanent
concurrency test suite remain future hardening work.
