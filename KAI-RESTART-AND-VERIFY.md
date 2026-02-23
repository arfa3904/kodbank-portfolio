# KAI Assistant – Restart & Verification

## 1. Install dependencies (if not already)

From project root:

```bash
npm install
```

This installs `cors` and other dependencies. No API key or tokens are in code; `HF_API_KEY` is read from `backend/.env` only.

---

## 2. Stop any process on port 3000 or 5000

**Windows (PowerShell):**

```powershell
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

Or close the terminal where the server is running and press `Ctrl+C` if it’s in the foreground.

**Optional – use a different port:** Set in `backend/.env`:

```env
PORT=5000
```

Default in code is already 5000 if `PORT` is not set.

---

## 3. Start the server

From project root:

```bash
npm start
```

Expected output:

- `Server running on port 5000`
- (If DB is configured) DB connection success message

There must be only **one** `app.listen` (in `backend/index.js`). No other file should call `app.listen` or create another HTTP server.

---

## 4. Verify the full flow

1. **Open app:**  
   `http://localhost:5000`  
   (or the port shown in the start log)

2. **Login:** Use your KodBank credentials (e.g. register first if needed).

3. **Dashboard:** You should see the KODBANK dashboard with a **KAI** button (e.g. bottom-right).

4. **Open KAI:** Click **KAI** → should open the KAI chat page (same origin, e.g. `http://localhost:5000/kai.html`).

5. **Send a message:** Type e.g. “hi” and click **Send**.
   - **Loading:** “Thinking...” (or spinner) appears.
   - **Success:** AI reply appears in a gray bubble on the left; your message stays in a blue bubble on the right.
   - **Error:** You see a short error message (e.g. “Model is starting up…”, “Check HF_API_KEY…”, “Network error…”). No API key is ever shown in the UI.

6. **Backend:** All AI requests go to **same origin** → `http://localhost:5000/api/kai-chat` (no hardcoded port in frontend; it uses `window.location.origin`).

7. **CORS:** Backend uses `cors({ origin: true, credentials: true })` so the frontend (same origin or allowed origin) can call the API with cookies if needed.

---

## 5. If the server still says “address already in use”

- Confirm only one terminal is running `npm start` (or `node backend/index.js`).
- Kill any process using the port (see step 2).
- Or set a different port in `backend/.env`, e.g. `PORT=5001`, then use `http://localhost:5001` for testing.

---

## 6. Environment variables (no hardcoded secrets)

- **Backend only:** `backend/.env` must contain:
  - `HF_API_KEY=<your HuggingFace token>`
  - Optionally `MODEL_NAME=CohereLabs/tiny-aya-base` (this is the default in code)
  - Optionally `PORT=5000`
- **Frontend:** Does not use or display `HF_API_KEY`; it only calls `/api/kai-chat` on the current origin.
