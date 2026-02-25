# Texas Real Estate Umbrella Insurance MVP

A runnable end-to-end MVP quote + issue system for **Texas-only** real estate umbrella insurance.

> Current local patch mode: SQLite for immediate local demo (no external DB). Postgres can be restored later.

## What this MVP does

- Login with email/password
- Authenticated dashboard of submissions/policies
- Create new submission with insured + property schedule (1–5 properties)
- Calculate quote using deterministic TX rating table
- Issue policy with atomic TX policy number
- Generate/download declarations PDF
- Persist all data in PostgreSQL
- Role-based access control (`AGENT`, `ADMIN`)
- Audit logging for critical actions

## Tech Stack

- Next.js 14 (App Router + Route Handlers)
- Prisma ORM + PostgreSQL
- Tailwind CSS
- Custom secure HTTP-only cookie sessions
- bcrypt password hashing
- PDFKit for declarations PDF
- Vitest for unit tests

## API Endpoints

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/submissions`
- `PUT /api/submissions/:id`
- `POST /api/submissions/:id/quote`
- `POST /api/submissions/:id/issue`
- `GET /api/policies/:id/pdf`
- `POST /api/rate` (simple external rating API)

### `/api/rate` request
Requires header: `x-api-key: <RATE_API_KEY>`

```json
{
  "coverageAmount": 1000000,
  "locationCount": 3
}
```

Response premium uses:
`(coverageAmount / 1000) * 2.3 * locationCount`

## Data Model

Implemented tables/entities:
- `User`
- `Session`
- `Account`
- `Submission`
- `Property`
- `Quote`
- `Policy`
- `AuditEvent`
- `PolicySequence` (for atomic policy numbering)

## Policy Number Format

`REU-{YY}TX-{SEQUENCE}`

Example: `REU-26TX-000001`

- `YY`: two-digit year from effective date
- `SEQUENCE`: atomic, zero-padded 6-digit increment per TX year

## TX Rating Engine

Location: `lib/rating.ts`

Configurable constants/tables:
- `MIN_UNDERLYING_LIMIT`
- `MIN_PROPERTY_COUNT`, `MAX_PROPERTY_COUNT`
- `TX_BASE_RATE`
- `TX_TAX_RATE`
- `TX_FLAT_FEE`
- `LIMIT_FACTOR` (`1M`, `2M`, `5M`)
- `PROPERTY_COUNT_FACTOR` (`1..5`)

Rules:
1. Block quote if underlying limit < minimum.
2. Block quote if property count outside 1–5.
3. If any occupancy is `VACANT`, return **Refer** (quote can be saved as refer; issuing blocked).
4. Premium formula:
   - `base = TX_BASE_RATE * LIMIT_FACTOR[umbrellaLimit] * PROPERTY_COUNT_FACTOR[propertyCount]`
   - `taxesAndFees = round(base * TX_TAX_RATE + TX_FLAT_FEE, 2)`
   - `totalPremium = round(base + taxesAndFees, 2)`

Quote stores `ratingInputsJson` and `ratingOutputsJson`.

## Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
```bash
copy .env.example .env
```

Set your Postgres connection in `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tx_umbrella_mvp?schema=public"
SEED_ADMIN_PASSWORD="ChangeMe123!"
SEED_AGENT_PASSWORD="ChangeMe123!"
RATE_API_KEY="replace-with-strong-api-key"
```

### 3) Initialize database schema and generate Prisma client
```bash
npx prisma generate
npx prisma db push
```

### 4) Seed users
```bash
npm run prisma:seed
```

### 5) Start app
```bash
npm run dev
```

Open `http://localhost:3000`.

## Seed Credentials

- Admin: `admin@example.com` / `ChangeMe123!`
- Agent: `agent@example.com` / `ChangeMe123!`

## End-to-End Scenario

1. Login as `agent@example.com`.
2. Click **New Quote Submission**.
3. Enter account + 1–5 TX properties.
4. Save draft (creates submission).
5. Open submission and click **Rate Quote**.
6. Review premium breakdown.
7. Click **Issue Policy**.
8. Open policy page and click **Download Declarations PDF**.

Generated PDFs are stored in `storage/policies`.

## Tests

Run minimal unit tests for rating and policy number formatting:

```bash
npm test
```

## Security Notes

- Passwords are hashed with bcrypt.
- Sessions are HTTP-only cookies.
- Server-side validation via zod.
- RBAC enforced in API routes/pages.
- Audit events logged for login/logout/create/quote/issue/update.
- No secrets hardcoded; use `.env`.

## Architecture

See `ARCHITECTURE.md` for a one-page overview.
