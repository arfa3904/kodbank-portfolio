// Authentication Routes
// Handles login and token generation

const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const router = express.Router();

// POST /login - User login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email input
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Check if user exists in customer_accounts table
        const users = await query(
            'SELECT customer_id, customer_name, email FROM customer_accounts WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email. User not found.' 
            });
        }

        const user = users[0];

        // Generate JWT token with 1 hour expiry
        const token = jwt.sign(
            { customer_id: user.customer_id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Calculate expiry timestamp (1 hour from now)
        const expiry = new Date();
        expiry.setHours(expiry.getHours() + 1);

        // Store token in bank_user_jwt table
        await query(
            'INSERT INTO bank_user_jwt (token_value, customer_id, expiry) VALUES (?, ?, ?)',
            [token, user.customer_id, expiry]
        );

        // Send token as HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,  // Prevents JavaScript access (XSS protection)
            secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
            sameSite: 'strict',  // CSRF protection
            maxAge: 3600000  // 1 hour in milliseconds
        });

        res.json({ 
            success: true, 
            message: 'Login successful',
            customer_name: user.customer_name
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during login.' 
        });
    }
});

module.exports = router;
