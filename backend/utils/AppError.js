// A thrown error that already knows the HTTP status + user-facing message it
// should produce, so route handlers can just `throw new AppError(...)` and
// let the central error handler (middleware/errorHandler.js) turn it into a
// response instead of every route hand-rolling try/catch + res.status(...).
class AppError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'AppError';
        this.status = status;
    }
}

module.exports = AppError;
