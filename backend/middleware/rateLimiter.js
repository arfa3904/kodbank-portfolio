const rateLimit = require('express-rate-limit');

// Login/register are the only unauthenticated write endpoints, so they're the
// ones worth throttling against credential-stuffing / registration spam.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again later.' }
});

module.exports = { authLimiter };
