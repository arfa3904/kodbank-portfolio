// Auth routes: registration and login. On login, generate JWT, store in BankUserJwt, set cookie.

const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const router = express.Router();

// POST /register - create new bank user (Cname, Cpwd, email; balance default 0)
router.post('/register', async (req, res) => {
    try {
        const { Cname, Cpwd, email } = req.body;
        if (!Cname || !Cpwd || !email) {
            return res.status(400).json({ success: false, message: 'Name, password and email are required.' });
        }
        await query(
            'INSERT INTO BankUser (Cname, Cpwd, balance, email) VALUES (?, ?, 0, ?)',
            [Cname.trim(), Cpwd, email.trim()]
        );
        res.status(201).json({ success: true, message: 'Registration successful. You can login now.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }
        console.error('Register error:', err.message);
        res.status(500).json({ success: false, message: 'Registration failed.' });
    }
});

// POST /login - validate email + password, generate JWT, store in BankUserJwt, set cookie
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const users = await query(
            'SELECT Cid, Cname, Cpwd, email FROM BankUser WHERE email = ?',
            [email.trim()]
        );
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = users[0];
        if (user.Cpwd !== password) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { Cid: user.Cid, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const exp = new Date();
        exp.setHours(exp.getHours() + 1);

        await query(
            'INSERT INTO BankUserJwt (tokenvalue, Cid, exp) VALUES (?, ?, ?)',
            [token, user.Cid, exp]
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000
        });

        res.json({ success: true, message: 'Login successful', Cname: user.Cname });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ success: false, message: 'Login failed.' });
    }
});

module.exports = router;
