// Business logic for registration, login, session issuance/revocation.
// Routes stay thin: parse the request, call one of these, shape the response.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const config = require('../config');
const AppError = require('../utils/AppError');
const { isValidEmail, isValidPassword, isValidName } = require('../utils/validators');

const SALT_ROUNDS = 10;

async function register({ Cname, email, Cpwd }) {
    if (!isValidName(Cname)) {
        throw new AppError(400, 'Name must be between 2 and 100 characters.');
    }
    if (!isValidEmail(email)) {
        throw new AppError(400, 'Enter a valid email address.');
    }
    if (!isValidPassword(Cpwd)) {
        throw new AppError(400, 'Password must be at least 6 characters.');
    }

    const passwordHash = await bcrypt.hash(Cpwd, SALT_ROUNDS);

    try {
        await query(
            'INSERT INTO BankUser (Cname, Cpwd, balance, email) VALUES (?, ?, 500000, ?)',
            [Cname.trim(), passwordHash, email.trim().toLowerCase()]
        );
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            throw new AppError(409, 'An account with this email already exists.');
        }
        throw err;
    }
}

async function login({ email, password }) {
    if (!isValidEmail(email) || !password) {
        throw new AppError(400, 'Email and password are required.');
    }

    const users = await query(
        'SELECT Cid, Cname, Cpwd, email FROM BankUser WHERE email = ?',
        [email.trim().toLowerCase()]
    );
    // Same generic message whether the email is unknown or the password is
    // wrong — don't help an attacker enumerate registered emails.
    if (users.length === 0) {
        throw new AppError(401, 'Invalid email or password.');
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.Cpwd);
    if (!match) {
        throw new AppError(401, 'Invalid email or password.');
    }

    const token = jwt.sign({ Cid: user.Cid, email: user.email }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn
    });
    const exp = new Date(Date.now() + config.sessionTtlMs);

    await query('INSERT INTO BankUserJwt (tokenvalue, Cid, exp) VALUES (?, ?, ?)', [token, user.Cid, exp]);

    return { token, Cname: user.Cname, Cid: user.Cid };
}

async function logout({ token, Cid }) {
    if (!token || !Cid) return;
    await query('DELETE FROM BankUserJwt WHERE tokenvalue = ? AND Cid = ?', [token, Cid]);
}

async function getProfile(Cid) {
    const rows = await query('SELECT Cid, Cname, email, created_at FROM BankUser WHERE Cid = ?', [Cid]);
    if (rows.length === 0) {
        throw new AppError(404, 'Account not found.');
    }
    const u = rows[0];
    return { Cid: u.Cid, Cname: u.Cname, email: u.email, createdAt: u.created_at };
}

module.exports = { register, login, logout, getProfile };
