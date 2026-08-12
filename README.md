# KODBANK

A full-stack banking demo: register, sign in, check your balance, transfer
money to another account, review transaction history, and ask **KAI** (an
AI banking assistant) for help — all backed by a real REST API, JWT
authentication, hashed passwords, and atomic money transfers.

Built as a portfolio project to demonstrate authentication, relational
schema design, transactional integrity, REST API design, and a modern React
frontend — not a tutorial CRUD app with extra colors.

## Table of contents

1. [Key features](#key-features)
2. [Architecture](#architecture)
3. [Technology stack](#technology-stack)
4. [Authentication flow](#authentication-flow)
5. [Database schema](#database-schema)
6. [API endpoints](#api-endpoints)
7. [KAI — AI assistant](#kai--ai-assistant)
8. [Security](#security)
9. [Project structure](#project-structure)
10. [Setup](#setup)
11. [Aiven MySQL setup](#aiven-mysql-setup)
12. [Hugging Face setup](#hugging-face-setup)
13. [Running locally](#running-locally)
14. [Testing performed](#testing-performed)
15. [Screenshots](#screenshots)
16. [Known limitations & future enhancements](#known-limitations--future-enhancements)

## Key features

- Email + password registration and login, passwords hashed with bcrypt
- JWT session in an HTTP-only cookie, backed by a revocable session table
  (logout actually invalidates the session, not just the cookie)
- Real-time balance check, scoped strictly to the authenticated user
- Money transfer by account ID or email, wrapped in a single atomic
  database transaction (balances can never end up debited-but-not-credited)
- Full validation: positive amounts, sufficient balance, no self-transfer,
  receiver must exist
- Transaction history with search, date-range and type filters, and
  loading/empty/error states
- KAI, a banking assistant proxied through the backend (Hugging Face
  Inference API with a transparent local fallback — never fakes an AI reply)
- Responsive, accessible fintech-style UI (desktop sidebar / mobile bottom
  tab bar, keyboard-navigable forms, visible focus states)

## Architecture

The repository previously contained **three frontend generations**
(`client/`, `frontend/`, `client-react/`) and **two backend generations**
(`server/`, `backend/`). The legacy ones (`server/`, `client/`, `frontend/`)
have been removed — `backend/` and `client-react/` are now the only,
canonical implementation.

```
┌─────────────────────┐        HTTPS / cookies        ┌──────────────────────┐
│   client-react (SPA) │ ─────────────────────────────▶│   backend (Express)  │
│  Vite + React + TS   │◀───────────────────────────── │  REST API, /api/*    │
└─────────────────────┘        JSON responses          └──────────┬───────────┘
                                                                    │
                                        ┌───────────────────────────┼───────────────────────────┐
                                        ▼                           ▼                           ▼
                              MySQL (Aiven, prod)        Local file DB (dev fallback)   Hugging Face Inference API
                              BankUser / BankUserJwt /    backend/data/db.json           (KAI, optional — proxied,
                              BankTransferLog             — same query interface         API key never reaches
                                                            as MySQL                       the browser)
```

- **Dev:** the SPA runs on Vite (`:5173`) and proxies `/api/*` to Express
  (`:5000`) so cookies work across both ports as if same-origin.
- **Prod:** `npm run build` outputs `client-react/dist`, and `backend/index.js`
  serves it directly (with an SPA fallback for client-side routes) — one
  process, one port.
- **Database:** the backend talks to MySQL (Aiven) when `DB_*` env vars are
  set and reachable; otherwise it **automatically falls back** to a local
  JSON file store (`backend/data/db.json`) so the app runs with zero
  external setup. Both paths go through the same `query()` / `transaction()`
  interface (`backend/db.js`), so route code never needs to know which one
  is active.

## Technology stack

**Frontend** — React 18, TypeScript, Vite, React Router, Recharts, plain CSS
(design tokens + per-feature stylesheets, no UI framework).

**Backend** — Node.js, Express, `jsonwebtoken`, `bcryptjs`, `mysql2/promise`,
`cookie-parser`, `cors`, `express-rate-limit`, `dotenv`.

**Database** — MySQL (Aiven-hosted in production), with a JSON-file fallback
for zero-config local development.

**AI** — Hugging Face Inference API, called from the backend only.

## Authentication flow

1. **Register** (`POST /api/auth/register`) — name, email, password. Password
   is hashed with **bcrypt** (10 salt rounds) before it ever touches the
   database; the plaintext is never stored or logged. New accounts start
   with a demo balance of ₹500,000.
2. **Login** (`POST /api/auth/login`) — backend looks up the user by email,
   compares the submitted password against the bcrypt hash with
   `bcrypt.compare`, and on success signs a JWT (`{ Cid, email }`, 1 hour
   expiry) with `JWT_SECRET`. The token is written to `BankUserJwt` (session
   record) **and** set as an `httpOnly`, `sameSite=lax` cookie
   (`secure` in production).
3. **Protected requests** — `middleware/verifyToken.js` first verifies the
   JWT cryptographically (signature + expiry) — this is the primary,
   always-enforced check. It then checks `BankUserJwt` for the session
   record as a **revocation list**: a cryptographically valid but
   explicitly-logged-out token is still rejected. If the DB check itself
   fails (e.g. a transient connection issue), the request is allowed
   through on the JWT alone rather than taking the whole API down.
4. **Logout** (`POST /api/auth/logout`) — deletes the session row from
   `BankUserJwt` and clears the cookie, so the token can't be replayed even
   though it hasn't cryptographically expired yet.

The authenticated user's ID always comes from the verified JWT
(`req.Cid`) — no route ever trusts a customer ID supplied by the client for
a protected operation.

## Database schema

```sql
BankUser
  Cid          INT PK AUTO_INCREMENT
  Cname        VARCHAR(100)
  Cpwd         VARCHAR(255)   -- bcrypt hash, never plaintext
  balance      DECIMAL(15,2)  DEFAULT 500000.00, CHECK (balance >= 0)
  email        VARCHAR(150)   UNIQUE
  created_at   TIMESTAMP

BankUserJwt                                    -- one row per active session
  tokenid      INT PK AUTO_INCREMENT
  tokenvalue   TEXT
  Cid          INT FK → BankUser.Cid  (ON DELETE CASCADE)
  exp          TIMESTAMP
  created_at   TIMESTAMP

BankTransferLog                                -- append-only transfer ledger
  id             INT PK AUTO_INCREMENT
  sender_cid     INT FK → BankUser.Cid
  receiver_cid   INT FK → BankUser.Cid
  sender_label   VARCHAR(150)
  receiver_label VARCHAR(150)
  amount         DECIMAL(15,2)
  type           ENUM('transfer')
  reference      VARCHAR(255) NULL
  status         ENUM('completed','failed')
  created_at     TIMESTAMP
```

Full DDL with indexes and sample (bcrypt-hashed) demo accounts is in
[`database/database.sql`](database/database.sql) — safe to run on a fresh database.

## API endpoints

All responses are JSON: `{ success: boolean, ... }` on success,
`{ success: false, message }` on error. Endpoints under `/api/banking/*`
require the `token` cookie (or `Authorization: Bearer <token>`).

| Method | Route | Description | Status codes |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | 201, 400, 409, 500 |
| POST | `/api/auth/login` | Sign in, sets cookie | 200, 400, 401, 500 |
| POST | `/api/auth/logout` | Revoke session, clear cookie | 200 |
| GET | `/api/auth/me` | Current user profile | 200, 401 |
| GET | `/api/banking/balance` | Authenticated user's balance | 200, 401, 404 |
| GET | `/api/banking/receivers` | Other accounts available as transfer targets | 200, 401 |
| POST | `/api/banking/transfer` | Atomic money transfer | 200, 400, 401, 404 |
| GET | `/api/banking/transactions` | Last 20 transfers (debit/credit) | 200, 401 |
| POST | `/api/kai-chat` | KAI assistant reply | 200, 400 |

### Money transfer — atomicity

`services/bankingService.js#transferFunds` runs entirely inside
`db.transaction()`:

```
BEGIN
  SELECT sender  ... FOR UPDATE
  SELECT receiver ... FOR UPDATE   -- resolved by account ID or email
  validate: receiver exists, not self, sender balance >= amount
  UPDATE sender balance   (-amount)
  UPDATE receiver balance (+amount)
  INSERT BankTransferLog row
COMMIT   -- or ROLLBACK on any thrown error, leaving both balances untouched
```

On MySQL this is a real `BEGIN`/`COMMIT`/`ROLLBACK` with row locks
(`FOR UPDATE`) so two concurrent transfers touching the same account can't
both read a stale balance. The local file-DB fallback gets the same
all-or-nothing guarantee by mutating an in-memory copy of the JSON store and
only persisting it to disk once the whole transfer function returns
successfully — a thrown error (insufficient balance, bad receiver, etc.)
means nothing is written at all.

## KAI — AI assistant

- Frontend sends `{ message }` to `POST /api/kai-chat` — see
  `client-react/src/components/kai/Kai.tsx` and `src/api/kai.ts`.
- The backend (`backend/routes/kai.js`) proxies the request to the Hugging
  Face Inference API using `HF_API_KEY` (read from `backend/.env` only —
  **the key is never sent to the browser**), with a 12s timeout.
- If `HF_API_KEY` isn't set, the call fails, or the model errors out, KAI
  falls back to a small local rule-based responder scoped to what a KODBANK
  user would actually ask (balance, transfers, transaction history,
  register/login help). The response is never presented as coming from a
  model that didn't actually run — the API includes a `source` field
  (`"huggingface"` or `"fallback"`) for transparency.
- Configurable via `MODEL_NAME` (defaults to `google/flan-t5-base`) and
  `HF_API_KEY` — no hardcoded credentials.
- KAI never fabricates account data: it doesn't know your balance or
  transaction history, it just tells you where to find them in the app.

## Security

- **Passwords** — bcrypt hashed (10 rounds), never logged, never returned
  by any API response.
- **Sessions** — JWT in an `httpOnly` cookie (`sameSite=lax`, `secure` in
  production) + a server-side revocation table so logout is real.
- **Authorization** — every banking route re-derives the customer ID from
  the verified JWT; a client can never supply/override it.
- **Rate limiting** — `/api/auth/login` and `/api/auth/register` are
  limited to 30 requests / 15 min per IP (`express-rate-limit`).
- **Input validation** — email format, password length, positive-amount
  checks, all enforced server-side (`backend/utils/validators.js`), not just
  in the UI.
- **Centralized error handling** — `middleware/errorHandler.js` ensures
  5xx responses never leak stack traces or internal error text to the
  client; only 4xx messages (already user-safe) are passed through.
- **No secrets in the frontend** — `HF_API_KEY` and `JWT_SECRET` only ever
  exist in `backend/.env`, read server-side.
- **CORS** — configured with `credentials: true` and an explicit origin
  check rather than a wildcard.
- Body size limits (`100kb`) on JSON/urlencoded parsing to reduce trivial
  abuse.

## Project structure

```
kodbankapp/
├── backend/
│   ├── index.js              # app entry: mounts routes, serves client-react/dist in prod
│   ├── config/index.js       # env-derived config (JWT secret, cookie options, port)
│   ├── db.js                 # MySQL pool + file-DB fallback, query()/transaction()
│   ├── middleware/
│   │   ├── verifyToken.js    # JWT + session-revocation check
│   │   ├── errorHandler.js   # asyncHandler wrapper + centralized error responses
│   │   └── rateLimiter.js    # auth endpoint throttling
│   ├── services/
│   │   ├── authService.js    # register/login/logout/profile business logic
│   │   └── bankingService.js # balance/receivers/transfer/transactions logic
│   ├── routes/                # thin HTTP layer: parse request → call service → shape response
│   │   ├── auth.js  banking.js  kai.js
│   ├── utils/
│   │   ├── AppError.js  validators.js
│   ├── data/
│   │   ├── seed.json         # clean demo dataset (committed)
│   │   └── db.json           # runtime file-DB (gitignored, regenerated from seed.json)
│   └── .env.example
├── client-react/              # canonical frontend — see client-react/README.md
│   └── src/
│       ├── api/               # centralized fetch wrappers (client, auth, banking, kai)
│       ├── components/        # reusable UI (Button, Card, Modal, KAI chat, …)
│       ├── context/           # AuthContext, ToastContext
│       ├── hooks/              # useReceivers, useTransactions
│       ├── layouts/            # AppShell, TopBar, SidebarNav, BottomTabBar
│       ├── pages/               # one folder per route: auth, dashboard, transfer, statement, cards, settings
│       ├── types/               # shared TS types
│       ├── utils/                # formatting/aggregation helpers (stats.ts)
│       ├── App.tsx  main.tsx
├── database/
│   └── database.sql           # MySQL schema + demo accounts (bcrypt-hashed)
├── docs/
│   └── AIVEN-SETUP.md         # step-by-step Aiven MySQL walkthrough
├── scripts/
│   ├── run-schema.js  test-connection.js   # Aiven helpers
│   └── seed-file-db.js                     # reset local file-DB from seed.json
└── package.json
```

## Setup

```bash
npm install                        # backend deps
cd client-react && npm install && cd ..   # frontend deps (first time only)
cp backend/.env.example backend/.env
```

Then edit `backend/.env`:

```env
# Aiven MySQL (leave blank to use the local file-DB fallback instead)
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_SSL=true

# Long random string — generate with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=

# Optional — KAI works via local fallback even without these
MODEL_NAME=google/flan-t5-base
HF_API_KEY=

PORT=5000
NODE_ENV=development
```

`.env` files are gitignored; only `backend/.env.example` (placeholders) is
committed. Never commit real credentials.

## Aiven MySQL setup

1. Create a MySQL service on [Aiven](https://aiven.io/) and note the host,
   port, user, password, and database name from the service overview.
2. Fill in `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` in
   `backend/.env`, and set `DB_SSL=true` (required by Aiven).
3. Initialize the schema — either paste [`database/database.sql`](database/database.sql) into
   Aiven's Query console, or run it from your machine:
   ```bash
   node scripts/test-connection.js   # sanity-check the connection first
   node scripts/run-schema.js        # creates the DB, tables, and demo accounts
   ```
4. Restart the backend — it will log `Database connected (MySQL)` instead of
   falling back to the file DB.

See [`docs/AIVEN-SETUP.md`](docs/AIVEN-SETUP.md) for a more detailed,
click-by-click walkthrough (including the Aiven console UI).

If `DB_HOST` is left blank or MySQL is unreachable, the backend **automatically
falls back** to `backend/data/db.json` (auto-created from
`backend/data/seed.json` on first run) — no setup required for local dev.
Run `npm run seed` any time to reset that local dataset back to the clean
seed.

## Hugging Face setup

1. Create a free account at [huggingface.co](https://huggingface.co) and
   generate an access token (Settings → Access Tokens).
2. Set `HF_API_KEY` in `backend/.env`. Optionally set `MODEL_NAME` (defaults
   to `google/flan-t5-base`).
3. Without a key configured, KAI still works — it just always uses the
   local fallback responses instead of calling a hosted model.

## Running locally

```bash
# Terminal 1 — backend API
npm install
npm start                 # http://localhost:5000

# Terminal 2 — frontend (dev mode, hot reload)
cd client-react
npm install
npm run dev                # http://localhost:5173, proxies /api to :5000
```

Open **http://localhost:5173** and either register a new account or sign in
with a seeded demo account (see `database/database.sql` / `backend/data/seed.json`):

| Email | Password | Starting balance |
|---|---|---|
| `omkar@kodbank.dev` | `Omkar@123` | ₹500,000 |
| `abhaya@kodbank.dev` | `Abhaya@123` | ₹600,000 |
| `demo@kodbank.dev` | `Demo@1234` | ₹500,000 |

**Production-style run** (single server, no separate Vite dev server):

```bash
npm run build              # builds client-react/dist
npm start                  # Express serves the API + the built SPA on :5000
```

## Testing performed

Verified end-to-end against the running backend (file-DB mode, via `curl`)
and with `tsc -b` / `vite build` for the frontend:

- **Registration** — valid registration succeeds; duplicate email → 409;
  password under 6 chars → 400; passwords are stored as bcrypt hashes
  (verified by inspecting `backend/data/db.json` directly).
- **Login** — correct credentials succeed and set the `token` cookie;
  wrong password and unknown email both return the same generic
  "Invalid email or password" (no user enumeration).
- **Auth middleware** — no cookie → 401; tampered/invalid JWT → 401;
  `/api/auth/me` and `/api/banking/*` all require a valid session.
- **Logout** — deletes the `BankUserJwt` row and clears the cookie; a
  subsequent request with the old cookie is rejected.
- **Balance** — always scoped to `req.Cid` from the verified JWT.
- **Transfer** — happy path (by account ID and by email) both verified;
  self-transfer, insufficient balance, negative amount, and unknown
  receiver all correctly rejected without mutating any balance;
  transaction log and both balances update atomically together.
- **KAI** — returns a local fallback reply when no `HF_API_KEY` is
  configured, with `source: "fallback"` in the response; empty message
  correctly rejected with 400.
- **Rate limiting** — confirmed `RateLimit-*` headers present on
  `/api/auth/login`.
- **SPA serving** — production build (`vite build`) served correctly by
  Express for both the root route and deep links (e.g. `/dashboard`),
  with `/api/*` 404s handled separately from the SPA fallback.
- **Frontend build** — `tsc -b` (strict type-check) and `vite build` both
  pass with zero errors.

Not covered by this pass (see below): browser-based manual QA of every
responsive breakpoint, and a live Hugging Face call (no key was available
in this environment — the proxy code path and timeout/fallback logic were
verified, but not a real HF response).

## Screenshots

_Add screenshots of the login page, dashboard, transfer flow, and KAI
assistant here before publishing._<img width="1600" height="760" alt="4de1152a-e28a-463a-8985-9c668387477d" src="https://github.com/user-attachments/assets/2a813aac-906a-47b1-880a-d2beee2cf5d2" />


## Known limitations & future enhancements

- Dashboard stats/chart are computed client-side from transaction history
  (no dedicated analytics endpoint) — real data, just aggregated in the
  browser rather than the API.
- Cards / Pay-bills are clearly-labeled previews with no backend behind
  them yet (no fake balances or fake transactions are shown).
- Settings → Preferences toggles are decorative and labeled "Coming soon".
- No password-reset flow yet.
- Frontend bundle is a single ~580 kB chunk; code-splitting by route
  (`React.lazy`) would improve initial load time.
- No automated test suite (Jest/Vitest + supertest) yet — testing so far is
  manual/scripted (`curl`) as described above.
