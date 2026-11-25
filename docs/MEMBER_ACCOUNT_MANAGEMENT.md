# Member Account Management

## Provisioning

Registering a new member requires a unique email address. LocalOrg creates the
member and one linked pending `MEMBER` user, but does not generate credentials
or send email. The member remains `PENDING_VERIFICATION` until an administrator
verifies the initial payment and explicitly approves the member.

Payment verification alone does not activate access. Approval after verified
payment sets the member eligible for invitation; the explicit send-invitation
action then generates the temporary credential, activates the eligible login
account, and sets `mustChangePassword`.

## Invitations

Invitation state is stored on the linked user as `NOT_SENT`, `PENDING`, `SENT`, `FAILED`, or
`RESENT`, with a timestamp, retry count, and sanitized delivery error. SMTP
failures do not delete the member or account. An administrator can call
`POST /api/members/:id/send-invitation`; this creates a new temporary credential,
invalidates the prior credential, and requires setup again. The endpoint is
rate-limited and never returns the credential.

## Administration endpoints

- `POST /api/members` provisions the member and account.
- `PATCH /api/members/:id/verification` approves or rejects after payment
  verification.
- `POST /api/members/:id/send-invitation` sends the first invitation explicitly.
- `POST /api/members/:id/resend-invitation` replaces a prior credential and
  resends an invitation.
- `PATCH /api/members/:id/account-status` enables, suspends, or disables login.
- `GET /api/members/:id` exposes safe account and invitation status only.

An administrator can disable an account without changing membership history.
Enabling an account is rejected until the member is `ACTIVE`.

## First login

After payment verification, the member signs in with the emailed temporary
password. The login succeeds only for an active member/account, then the
backend restricts member APIs until `POST /api/auth/change-password` succeeds.
The new password must be at least 10 characters and contain uppercase,
lowercase, and numeric characters; it must differ from the temporary password.
