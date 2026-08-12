// Centralized error handling: every route either throws (sync) or calls
// next(err) (async, via the asyncHandler wrapper below). This is the only
// place that decides what an error looks like on the wire, so responses stay
// consistent and stack traces never leak to the client.

function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    const status = err.status && Number.isInteger(err.status) ? err.status : 500;
    const message = status < 500 ? err.message : 'Something went wrong. Please try again.';

    if (status >= 500) {
        console.error(`[${req.method} ${req.originalUrl}]`, err);
    }

    res.status(status).json({ success: false, message });
}

function notFoundHandler(req, res) {
    res.status(404).json({ success: false, message: 'Not found.' });
}

module.exports = { asyncHandler, errorHandler, notFoundHandler };
