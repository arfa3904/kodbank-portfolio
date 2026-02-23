// JWT Token Verification Middleware
// Verifies JWT token from HTTP-only cookie and attaches customer_id to request

const jwt = require('jsonwebtoken');
const { query } = require('../db');

// Middleware to verify JWT token
async function verifyToken(req, res, next) {
    try {
        // Read token from HTTP-only cookie
        const token = req.cookies.token;

        // Check if token exists
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }

        // Verify JWT signature using secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if token exists in database
        const tokenCheck = await query(
            'SELECT * FROM bank_user_jwt WHERE token_value = ? AND customer_id = ?',
            [token, decoded.customer_id]
        );

        if (tokenCheck.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token. Token not found in database.' 
            });
        }

        // Check if token has expired
        const tokenData = tokenCheck[0];
        const now = new Date();
        const expiryDate = new Date(tokenData.expiry);

        if (now > expiryDate) {
            // Delete expired token from database
            await query(
                'DELETE FROM bank_user_jwt WHERE token_id = ?',
                [tokenData.token_id]
            );
            return res.status(401).json({ 
                success: false, 
                message: 'Token has expired. Please login again.' 
            });
        }

        // Attach customer_id to request object for use in routes
        req.customer_id = decoded.customer_id;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token signature.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token has expired.' 
            });
        }
        console.error('Token verification error:', error.message);
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error during token verification.' 
        });
    }
}

module.exports = verifyToken;
