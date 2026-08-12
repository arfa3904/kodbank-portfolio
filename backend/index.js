// KODBANK backend — Express API + (in production) the built React SPA.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config');
const { testConnection } = require('./db');
const { authLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const bankingRoutes = require('./routes/banking');
const kaiRoutes = require('./routes/kai');

const app = express();
app.disable('x-powered-by');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// -- API --------------------------------------------------------------------
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/banking', bankingRoutes);
app.use('/api', kaiRoutes);

// -- Frontend -----------------------------------------------------------------
// Dev: the React app runs on its own Vite server (npm run client:dev, :5173)
// and proxies /api to this server — nothing to serve here.
// Prod: serve the built SPA and let client-side routing handle the rest.
const clientDist = path.join(__dirname, '../client-react/dist');
app.use(express.static(clientDist, { index: false, maxAge: '1h' }));
app.get(/^(?!\/api\/).*/, (req, res, next) => {
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
        if (err) next(); // dist/ not built yet — fall through to 404
    });
});

app.use('/api', notFoundHandler);
app.use(errorHandler);

async function start() {
    const ok = await testConnection();
    if (!ok) {
        console.warn('Database not connected. API will fail until backend/.env is set.');
    }
    app.listen(config.port, () => {
        console.log(`KODBANK API running on http://localhost:${config.port}`);
    });
}

start();
