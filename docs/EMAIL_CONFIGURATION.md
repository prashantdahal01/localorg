# Email configuration

Copy the API environment example and set these values without committing
secrets:

```text
SMTP_PROVIDER=gmail
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=LocalOrg
SMTP_FROM_ADDRESS=
FRONTEND_URL=http://localhost:5173
```

`SMTP_SECURE=true` is appropriate for implicit TLS providers; otherwise use the
provider's submission port and STARTTLS configuration. The API validates that
host, port, and sender address exist before attempting delivery. Gmail requires
an app password when two-step verification is enabled; do not use a normal
account password. Missing or
failed delivery is recorded as `FAILED` and can be retried by an administrator.

Automated tests must use a controlled test transport or SMTP account. Never use
production recipients during testing, and never log SMTP credentials or
temporary passwords.
