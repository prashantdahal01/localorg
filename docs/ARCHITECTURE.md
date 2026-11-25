# LocalOrg Architecture

## Scope

Phase 0 and Phase 1 establish the JavaScript MERN foundation. Phase 2 adds the
presentation layer. Phase 3 adds authentication and authorization. Initial
membership contributions are a dedicated liability workflow; monthly savings
remain a separate financial module.

## Repository layout

```text
localorg/
├── api/                 # Express API and Mongoose integration
│   ├── src/config/      # Runtime configuration and database connection
│   ├── src/models/      # User, member, counter, session, token, and audit models
│   ├── src/controllers/ # HTTP request handlers
│   ├── src/middleware/  # Cross-cutting request/error middleware
│   ├── src/routes/      # Versionable API route composition
│   ├── src/services/    # Application/business services
│   ├── src/models/      # Mongoose models
│   └── src/server.js    # API process entry point
├── web/                 # React 18 + Vite frontend
│   └── src/
│       ├── api/         # Axios client and API hooks
│       ├── components/  # Reusable UI components
│       ├── components/layouts/ # Admin and member application shells
│       ├── components/ui/      # Buttons, cards, badges, tables, controls
│       └── pages/       # Route-level screens
└── docs/                # Project architecture and delivery records
```

## Runtime flow

1. Vite serves the React application on port 5173.
2. The frontend Axios client targets `VITE_API_URL/api`.
3. Express serves `/api/*` on port 5000 and applies CORS, JSON parsing, request
   logging, routes, and centralized error handling.
4. The API attempts a Mongoose connection using `MONGO_URI`. The API can start
   without MongoDB, but health output explicitly reports the database state.
5. `GET /api/health` is the Phase 1 service health endpoint.
6. React Router selects the admin or member shell. Both shells share navigation
   primitives and responsive behavior; no financial UI calls the API yet.
7. Authentication uses API-enforced roles, bcrypt password hashes, JWT access
   cookies, rotating server-side refresh sessions, and single-use activation/reset
   tokens.
8. Administrator member management uses server-side pagination and filtering,
   atomic yearly member-ID counters, explicit update allowlists, and audit
   events. Member portal authentication additionally requires an ACTIVE member
   record.
9. New members are created INACTIVE with one immutable-amount
   `InitialMembershipPayment` requirement. Only an administrator verification
   changes the member to ACTIVE; verified initial payments are aggregated as
   member-related liabilities, never revenue.
10. New registration provisions a linked `User` account and tracks invitation
    delivery state on that account. SMTP delivery is isolated in the invitation
    service, while authentication enforces `mustChangePassword` server-side.

## Configuration

- Backend: copy `api/.env.example` to `api/.env`.
- Frontend: copy `web/.env.example` to `web/.env`.
- Secrets belong only in ignored `.env` files; examples contain placeholders.

## Architectural rules

- Use JavaScript and ES modules throughout.
- Keep HTTP concerns in controllers/routes and persistence concerns in models/config.
- Add future financial modules under their own routes, controllers, services, and models.
- Do not introduce fake dashboard or financial data.
- Phase 2 dashboard values are explicitly labeled placeholders and are not persisted.
- Phase 4 member counts and initial membership liability dashboard values are
  live database aggregations; loans and other financial modules remain out of
  scope.
