// Auth guard for protected routes.
//
// 1. Cryptographic JWT verification (signature + expiry) is the primary,
//    always-enforced check — a request with no valid signed token is
//    rejected outright.
// 2. The BankUserJwt table is then consulted as a revocation list: if the
//    session was explicitly logged out (row deleted) the token is rejected
//    even though it's still cryptographically valid until its exp claim.
//    This is best-effort — if the DB check itself fails (e.g. transient
//    connection issue), the request is allowed through on the JWT alone
//    rather than taking the whole API down.

const jwt = require('jsonwebtoken');
const { query } = require('../db');
const config = require('../config');

async function verifyToken(req, res, next) {
    const token =
        req.cookies.token ||
        (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
            ? req.headers.authorization.slice(7)
            : null);

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    try {
        const rows = await query('SELECT * FROM BankUserJwt WHERE tokenvalue = ? AND Cid = ?', [token, decoded.Cid]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Session expired or logged out. Please sign in again.' });
        }
        if (rows[0].exp && new Date() > new Date(rows[0].exp)) {
            await query('DELETE FROM BankUserJwt WHERE tokenid = ?', [rows[0].tokenid]);
            return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
        }
    } catch (err) {
        console.warn('Session lookup failed, continuing on JWT verification alone:', err.message);
    }

    req.Cid = decoded.Cid;
    req.token = token;
    next();
}

module.exports = verifyToken;
