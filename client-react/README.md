# KODBANK — React/TS client

The canonical KODBANK frontend: a multi-view dashboard SPA (Vite + React 18 +
TypeScript + react-router-dom + recharts) that talks to the Express API in
`../backend`. See the [repo-root README](../README.md) for the full project
overview, API reference, and setup instructions — this file only covers the
client.

## Run (development)

1. Start the backend (from the repo root):

   ```bash
   npm start        # Express API on http://localhost:5000
   ```

2. Start this client in a second terminal:

   ```bash
   cd client-react
   npm install
   npm run dev      # Vite on http://localhost:5173
   ```

Open **http://localhost:5173**. Vite proxies `/api/*` to the backend on
`:5000` (see `vite.config.ts`), so cookies and the JWT session work across
both origins in dev.

> First run: register an account at `/register`, or sign in with a seeded
> demo account (`omkar@kodbank.dev` / `Omkar@123`) — see the root README.

## Build (production)

```bash
npm run build      # type-checks (tsc -b), then outputs static files to dist/
```

`backend/index.js` serves `client-react/dist` directly and falls back to
`index.html` for any non-`/api` route, so client-side routing works on a
hard refresh/deep link too.

## Structure

| Path | What |
|---|---|
| `src/layouts/` | AppShell (TopBar + SidebarNav desktop / BottomTabBar mobile + `<Outlet/>`) |
| `src/pages/dashboard/` | Balance hero, stat cards, recharts cash-flow chart, recent txns |
| `src/pages/transfer/` | Send-money form, recipient chips, confirmation modal |
| `src/pages/statement/` | Transaction table with date-range filter + search |
| `src/pages/cards/` | Card preview (no real card is issued — clearly marked) + pay-bills stub |
| `src/pages/settings/` | Profile (real data from `/api/auth/me`) / preferences (marked coming soon) |
| `src/pages/auth/` | Login (show/hide password) + Register (confirm password, strength meter) |
| `src/components/kai/` | Floating KAI chatbot (FAB + panel + typing indicator) |
| `src/api/` | `client.ts` fetch wrapper, `auth.ts`, `banking.ts`, `kai.ts` |
| `src/context/AuthContext.tsx` | Session state via `/api/auth/me` + `/api/banking/balance` |
| `src/context/ToastContext.tsx` | Global toast notifications (logout, transfer result) |

## Known limitations (intentionally not faked)

- **Stat cards & cash-flow chart** are derived client-side from
  `/api/banking/transactions` (`src/utils/stats.ts`) — there is no dedicated
  analytics endpoint. It's real data, just aggregated in the browser.
- **Cards page** is a visual preview only — KODBANK has no card-issuing
  backend, so the card number is fully masked and the control buttons are
  disabled with a "Coming soon" label instead of silently doing nothing.
- **Pay-bills** is a UI stub for the same reason (no billing endpoint).
- **Settings → Preferences** toggles are decorative (labeled "Coming soon");
  there's no `/api` endpoint backing them yet.
