const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
    return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

// Kept intentionally simple (length only) — this is a demo bank, not a
// production password policy. The point is "reject empty/trivial", not
// enforce a specific complexity ruleset.
function isValidPassword(value) {
    return typeof value === 'string' && value.length >= 6 && value.length <= 200;
}

function isValidName(value) {
    return typeof value === 'string' && value.trim().length >= 2 && value.trim().length <= 100;
}

function isPositiveAmount(value) {
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) && n > 0;
}

module.exports = { isValidEmail, isValidPassword, isValidName, isPositiveAmount };
