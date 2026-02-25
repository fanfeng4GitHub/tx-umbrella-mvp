# Architecture Overview (TX Umbrella MVP)

This MVP is a single Next.js 14 application using App Router for UI and Route Handlers for backend APIs. The design keeps all logic in one service for fast development and simple local operation.

## Components

- **Frontend (Next.js pages/components):**
  - `/login`
  - `/dashboard`
  - `/submissions/new`
  - `/submissions/[id]`
  - `/policies/[id]`
- **Backend APIs (Next.js route handlers):**
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `POST /api/submissions`
  - `PUT /api/submissions/:id`
  - `POST /api/submissions/:id/quote`
  - `POST /api/submissions/:id/issue`
  - `GET /api/policies/:id/pdf`
- **Database:** PostgreSQL via Prisma ORM
- **Session/Auth:** Custom secure session cookie + `Session` table
- **PDF Generation:** PDFKit writes declarations to `/storage/policies`

## Core Domain Flow

1. User logs in with email/password (bcrypt verified).
2. Agent/Admin creates submission (Account + Submission + Property rows).
3. Rating endpoint applies TX-only deterministic table logic.
4. Quote is stored with `ratingInputsJson` and `ratingOutputsJson`.
5. Issue endpoint checks quote eligibility/refer state, creates atomic TX policy number, stores policy, and generates PDF declarations.
6. Policy PDF is downloadable from `/api/policies/:id/pdf`.

## Policy Number Concurrency

Policy numbers are generated in a transaction using `PolicySequence` table with unique `(state, year)` and atomic increment. Format: `REU-{YY}TX-{SEQUENCE}`.

## Security

- Password hashing: bcrypt
- HTTP-only session cookie
- Server-side validation with zod
- RBAC checks on all protected routes (AGENT/ADMIN)
- Audit log table for key events
- Secrets via environment variables

## Scope Limitations (intentional)

No endorsements/renewals/cancellations, payments, commissions, external integrations, or complex underwriting rules in this MVP.
