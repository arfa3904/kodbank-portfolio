// Auth routes: POST /api/auth/register, /login, /logout, GET /api/auth/me

const express = require('express');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const verifyToken = require('../middleware/verifyToken');
const config = require('../config');
const { asyncHandler } = require('../middleware/errorHandler');
const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
    const { Cname, Cpwd, email } = req.body;
    await authService.register({ Cname, Cpwd, email });
    res.status(201).json({ success: true, message: 'Registration successful. You can log in now.' });
}));

router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { token, Cname } = await authService.login({ email, password });

    res.cookie('token', token, config.cookieOptions);
    res.json({ success: true, message: 'Login successful.', Cname });
}));

router.post('/logout', asyncHandler(async (req, res) => {
    const token = req.cookies.token;
    if (token) {
        // Best-effort: even an already-expired/tampered token should still
        // result in the cookie being cleared client-side, so don't reject
        // the request if decoding fails — just skip the DB-side revocation.
        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            await authService.logout({ token, Cid: decoded.Cid });
        } catch {
            /* token already invalid/expired: nothing to revoke */
        }
    }
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: config.isProduction });
    res.json({ success: true, message: 'Logged out.' });
}));

router.get('/me', verifyToken, asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.Cid);
    res.json({ success: true, user: profile });
}));

module.exports = router;
