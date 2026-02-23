// KODBANK Backend - Express API. Load env first so all modules see process.env.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { testConnection } = require('./db');
const authRoutes = require('./routes/auth');
const bankingRoutes = require('./routes/banking');
const kaiRoutes = require('./routes/kai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/', authRoutes);
app.use('/', bankingRoutes);
app.use('/', kaiRoutes);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../frontend/register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../frontend/dashboard.html')));
app.get('/kai.html', (req, res) => res.sendFile(path.join(__dirname, '../frontend/kai.html')));

async function start() {
    const ok = await testConnection();
    if (!ok) {
        console.error('Fix database config (e.g. Aiven .env) and restart.');
        process.exit(1);
    }
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

start();
