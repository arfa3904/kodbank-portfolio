// JWT verification middleware: read token from cookie, verify signature,
// ensure token exists in BankUserJwt and expiry (exp) not passed, then attach Cid to request

const jwt = require('jsonwebtoken');
const { query } = require('../db');

async function verifyToken(req, res, next) {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const rows = await query(
            'SELECT * FROM BankUserJwt WHERE tokenvalue = ? AND Cid = ?',
            [token, decoded.Cid]
        );
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid token.' });
        }

        const exp = new Date(rows[0].exp);
        if (new Date() > exp) {
            await query('DELETE FROM BankUserJwt WHERE tokenid = ?', [rows[0].tokenid]);
            return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
        }

        req.Cid = decoded.Cid;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
        }
        return res.status(500).json({ success: false, message: 'Token verification failed.' });
    }
}

module.exports = verifyToken;
