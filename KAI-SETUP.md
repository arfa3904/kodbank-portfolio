# KAI Assistant – Setup & Testing

## File structure

```
kodbankapp/
├── backend/
│   ├── .env                    # Add HF_API_KEY and MODEL_NAME (see below)
│   ├── .env.example            # Updated with KAI vars
│   ├── index.js                # Mounts kai routes
│   └── routes/
│       └── kai.js              # POST /api/kai-chat
├── frontend/
│   ├── css/
│   │   └── kai.css             # KAI button + modal styles
│   ├── js/
│   │   └── kai.js              # KAI open/close/send logic
│   └── dashboard.html          # Includes KAI button, modal, kai.css, kai.js
└── KAI-SETUP.md                # This file
```

## .env setup

In `backend/.env` add (or keep):

```env
MODEL_NAME=CohereLabs/tiny-aya-base
HF_API_KEY=your_huggingface_token_here
```

Server already loads `.env` via `dotenv` in `backend/index.js`. No code changes needed for env loading.

## Package installations

None. Backend uses native `fetch` (Node 18+). No new dependencies.

## Testing

1. Start server: `npm start`
2. Open: http://localhost:3000/login.html → sign in → dashboard
3. Click the **KAI** button (bottom-right). Modal should open.
4. Type a message and click **Send**. Loading spinner appears; then AI reply appears.
5. Close modal with **×** or by clicking outside.
6. If you see "Assistant unavailable", check `HF_API_KEY` in `backend/.env` and restart the server.

## Security

- `HF_API_KEY` is read only in backend (`process.env.HF_API_KEY`). Never sent to frontend.
- Frontend calls only `POST /api/kai-chat` with `{ message: "..." }`. No API key in requests.
- Same origin (frontend served by Express), so no CORS change.
