/**
 * PalmPay – Shared Validation Utilities
 * Used by all backend controllers for consistent, defensive input validation.
 */

const MAX_AMOUNT = 10_000_000; // Rs. 10 million hard cap per transaction
const MIN_AMOUNT = 1;          // Rs. 1 absolute minimum

/**
 * Sanitise and validate a monetary amount coming from any request (body, form-data).
 * Returns { valid: true, value: Number } or { valid: false, message: String }.
 */
function validateAmount(raw) {
    if (raw === undefined || raw === null || raw === '') {
        return { valid: false, message: 'Amount is required' };
    }

    // Reject obviously non-numeric strings early
    const str = String(raw).trim();

    // Reject empty, emoji, hex, binary, octal, scientific notation, special chars
    if (str === '') return { valid: false, message: 'Amount cannot be empty' };
    if (/[^0-9.\-]/.test(str)) return { valid: false, message: 'Amount contains invalid characters' };
    if (/e/i.test(str)) return { valid: false, message: 'Scientific notation is not allowed' };
    if ((str.match(/\./g) || []).length > 1) return { valid: false, message: 'Amount has multiple decimal points' };
    if ((str.match(/-/g) || []).length > 1) return { valid: false, message: 'Amount has multiple minus signs' };

    const num = parseFloat(str);

    if (isNaN(num)) return { valid: false, message: 'Amount is not a valid number' };
    if (!isFinite(num)) return { valid: false, message: 'Amount must be a finite number' };
    if (num <= 0) return { valid: false, message: 'Amount must be greater than zero' };
    if (num < MIN_AMOUNT) return { valid: false, message: `Minimum transaction amount is Rs. ${MIN_AMOUNT}` };
    if (num > MAX_AMOUNT) return { valid: false, message: `Maximum transaction amount is Rs. ${MAX_AMOUNT.toLocaleString()}` };

    // Guard against floating-point tricks (e.g. 0.0000001)
    const rounded = Math.round(num * 100) / 100;
    if (rounded <= 0) return { valid: false, message: 'Amount must be greater than zero' };

    return { valid: true, value: rounded };
}

/**
 * Sanitise a clerkId param/body field.
 */
function validateClerkId(raw) {
    if (!raw || typeof raw !== 'string' || raw.trim() === '') {
        return { valid: false, message: 'User identifier is required' };
    }
    const id = raw.trim();
    // Clerk IDs are prefixed with "user_" and are alphanumeric
    if (id.length < 5 || id.length > 60) {
        return { valid: false, message: 'Invalid user identifier' };
    }
    return { valid: true, value: id };
}

/**
 * Sanitise a MongoDB ObjectId string.
 */
function validateObjectId(raw, fieldName = 'ID') {
    if (!raw || typeof raw !== 'string' || raw.trim() === '') {
        return { valid: false, message: `${fieldName} is required` };
    }
    if (!/^[a-f\d]{24}$/i.test(raw.trim())) {
        return { valid: false, message: `${fieldName} is invalid` };
    }
    return { valid: true, value: raw.trim() };
}

/**
 * Sanitise a description/memo field.
 * Max 500 chars, strip leading/trailing whitespace.
 */
function sanitizeText(raw, maxLen = 500) {
    if (!raw) return '';
    return String(raw).trim().slice(0, maxLen);
}

/**
 * Validate a phone number (international format expected).
 */
function validatePhone(raw) {
    if (!raw || typeof raw !== 'string') {
        return { valid: false, message: 'Phone number is required' };
    }
    const phone = raw.trim();
    // Allow +, digits, spaces, dashes – min 7 max 16 digits
    if (!/^\+?[\d\s\-]{7,16}$/.test(phone)) {
        return { valid: false, message: 'Phone number format is invalid' };
    }
    return { valid: true, value: phone };
}

module.exports = { validateAmount, validateClerkId, validateObjectId, sanitizeText, validatePhone, MAX_AMOUNT, MIN_AMOUNT };
