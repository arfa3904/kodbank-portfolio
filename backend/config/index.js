const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev-secret-change-me';
    console.warn('JWT_SECRET not set; using a dev default. Set JWT_SECRET in backend/.env for production.');
}

module.exports = {
    isProduction,
    port: parseInt(process.env.PORT || '5000', 10),
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: '1h',
    sessionTtlMs: 60 * 60 * 1000, // must match jwtExpiresIn above
    cookieOptions: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60 * 1000
    }
};
