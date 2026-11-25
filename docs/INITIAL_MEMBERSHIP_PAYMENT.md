# Initial Membership Contribution

## Workflow

An administrator registers a member. LocalOrg assigns a unique member ID and
creates exactly one `INITIAL_MEMBERSHIP` payment requirement using the current
setting. The member starts `INACTIVE`. An administrator records the payment
method, amount, date, and bank reference where applicable, then verifies or
rejects it. Verification changes the member to `ACTIVE`; rejection requires a
reason and does not activate the member.

Member authentication and activation-token initiation both require an active
member, so pending or rejected payments cannot receive active access.

## Accounting

The required amount is stored on the payment record as an integer NPR amount.
Only `PAID` records are included in `totalInitialMembershipContributions`,
`totalInitialMembershipLiability`, and `memberRelatedLiability`. This is a
liability held for or owed to members, not income, revenue, profit, or ordinary
operating funds. Monthly savings use their existing `SavingsContribution` model
and calculations and are not combined with this category.

## Configuration and history

`GET/PATCH /api/initial-membership/settings` exposes the administrator setting.
It defaults to NPR 40,000, is required, and is one-time. Updating it applies only
to future requirements. Existing members are not charged or migrated and existing
payment records are never rewritten.

## Permissions and audit

Administrators can list, record, verify, reject, and summarize initial payments.
Members can read only their own records through `/api/initial-membership/me`.
Every creation, setting change, verification, rejection, and activation is
audited. Corrections to verified financial transactions use
`PATCH /api/initial-membership/:id/reverse` with a mandatory reason. The original
record remains intact, its status becomes `REVERSED`, the liability is removed
from verified totals, and the member is returned to `INACTIVE`.

## Validation

The API uses integer NPR validation, a unique member/payment index, backend role
checks, and status checks that prevent duplicate verification or rejection.
Automated baseline tests remain available through `npm test --prefix api`;
database-backed workflow scenarios require an isolated `TEST_MONGO_URI`.
