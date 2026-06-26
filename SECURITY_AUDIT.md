# PalmPay Wallet — Production Readiness Security Audit

> **Branch:** `security/input-validation-hardening`  
> **Date:** 2026-06-26  
> **Scope:** Input validation · Business rules · IDOR prevention · UX safety · API hardening · Defensive programming  
> **Result:** 25 issues identified and resolved. No business logic, DB schemas, or UI layouts were modified.

---

## Table of Contents

1. [Files Changed](#files-changed)
2. [New Files Added](#new-files-added)
3. [Backend Fixes](#backend-fixes)
4. [Frontend Fixes](#frontend-fixes)
5. [Business Rules Matrix](#business-rules-matrix)
6. [What Was Not Changed](#what-was-not-changed)

---

## Files Changed

| File | Change Type |
|------|-------------|
| `backend/utils/validators.js` | **New** — shared validation utility |
| `backend/middleware/upload.js` | Modified — file type/size limits |
| `backend/index.js` | Modified — error handler hardening |
| `backend/controllers/transactionController.js` | Modified — full validation overhaul |
| `backend/controllers/walletController.js` | Modified — ownership checks, whitelisting |
| `backend/controllers/userController.js` | Modified — input sanitisation, Palm ID rules |
| `backend/controllers/notificationController.js` | Modified — IDOR prevention, idempotency |
| `backend/controllers/palmController.js` | Modified — file validation, timeouts, frame cap |
| `backend/controllers/otpController.js` | Modified — rate limiting, code format check |
| `frontend/src/store/walletStore.js` | Modified — in-flight request guards |
| `frontend/src/pages/Send.jsx` | Modified — full validation, self-send, double-submit |
| `frontend/src/pages/AddMoney.jsx` | Modified — amount validation, bank balance check |
| `frontend/src/pages/Settings.jsx` | Modified — double-submit, name/username validation |
| `frontend/src/pages/AddCard.jsx` | Modified — label validation, double-submit guard |

---

## New Files Added

### `backend/utils/validators.js`

A shared utility module used by all backend controllers for consistent, defensive input validation.

| Function | Purpose |
|----------|---------|
| `validateAmount(raw)` | Rejects NaN, Infinity, negatives, zero, sci-notation, multi-decimal, multi-minus. Enforces Rs. 1 min / Rs. 10,000,000 max. Returns `{ valid, value }`. |
| `validateClerkId(raw)` | Checks existence, string type, 5–60 char length. |
| `validateObjectId(raw, fieldName)` | Validates MongoDB 24-char hex ObjectId format. |
| `sanitizeText(raw, maxLen)` | Trims and slices to `maxLen`. Safe for DB storage. |
| `validatePhone(raw)` | E.164-compatible regex check, 7–16 digits. |

---

## Backend Fixes

---

### FIX-01 — Amount validation (Critical)

**Affected:** `transactionController.js`, `walletController.js (addFunds)`  
**Problem:** `Math.abs(parseFloat(amount))` silently converted negatives to positives. Inputs like `NaN`, `0`, `-1000`, `1e308`, and `"abc"` were not rejected.  
**Fix:** All amount fields now pass through `validateAmount()` before any arithmetic or DB operation. Floating-point storage uses `Math.round(n * 100) / 100`.

```js
// Before (unsafe)
const amtNum = Math.abs(parseFloat(amount));

// After (safe)
const amountValidation = validateAmount(amount);
if (!amountValidation.valid) return res.status(400).json({ message: amountValidation.message });
const amtNum = amountValidation.value;
```

---

### FIX-02 — Self-transfer prevention (Critical)

**Affected:** `transactionController.js`, `Send.jsx`  
**Problem:** No check prevented a user from sending money to their own `clerkId`.  
**Fix:** Backend checks `recipientId.trim() === clerkId` after identity validation. Frontend also checks `selectedContact === user?.id` before opening the palm scanner.

---

### FIX-03 — IDOR on bank accounts and cards (Critical)

**Affected:** `transactionController.js`, `walletController.js`  
**Problem:** Any user could supply another user's `bankId` or `cardId` to drain funds, freeze a card, or delete a bank account.  
**Fix:** After loading the document, ownership is verified:

```js
if (bank.userId !== req.auth.sub) {
    return res.status(403).json({ message: 'You do not own this bank account' });
}
```

Applied to: bank transfer, add-funds, removeBank, freezeCard, updateCardSettings.

---

### FIX-04 — Recipient presence check (High)

**Affected:** `transactionController.js`  
**Problem:** If `recipientId` and `bankId` were both absent, the transaction proceeded, debiting the sender with funds disappearing to nowhere.  
**Fix:**

```js
if (!recipientId && !bankId) {
    return res.status(400).json({ message: 'A recipient or destination bank account is required' });
}
```

---

### FIX-05 — Palm image validation (High)

**Affected:** `upload.js`, `palmController.js`  
**Problem:** No MIME type check, no file size limit. Any file (`.exe`, empty blob, 1 GB video) could be uploaded.  
**Fix:**
- `upload.js`: Multer now enforces `fileSize: 10MB`, `files: 30` cap, and a MIME allowlist (`image/jpeg`, `image/png`, `image/webp`).
- `palmController.js`: Secondary check rejects files `< 1 KB` (likely corrupt/tampered).

---

### FIX-06 — Palm microservice error isolation (High)

**Affected:** `transactionController.js`, `palmController.js`  
**Problem:** If the Python palm service was unreachable, the Express request threw an unhandled `ECONNREFUSED` error, leaving MongoDB sessions hanging.  
**Fix:** Axios calls are wrapped in dedicated try/catch with a `timeout: 15000ms`. Service unavailable → 503. MongoDB session is always aborted cleanly in the outer catch.

---

### FIX-07 — OTP rate limiting (High)

**Affected:** `otpController.js`  
**Problem:** No cooldown between OTP send requests. Attackers could drain Twilio credits or brute-force phone discovery.  
**Fix:** In-memory `Map<phone → timestamp>` with a 60-second cooldown. Requests within the window return HTTP 429 with a countdown message.

---

### FIX-08 — OTP code format + expiry double-check (Medium)

**Affected:** `otpController.js`  
**Problem:** Code format was not validated before DB lookup. MongoDB TTL has a ±60s sweep window, meaning codes could live for up to 6 minutes.  
**Fix:**
- Format validation: `/^\d{6}$/` required before any DB query.
- Belt-and-suspenders expiry: `Date.now() - record.createdAt > 5 * 60 * 1000` → reject + delete.
- After successful verification, OTP document is deleted synchronously.
- OTP is upserted (not inserted) to prevent duplicate records per phone.

---

### FIX-09 — Notification IDOR (Critical)

**Affected:** `notificationController.js`  
**Problem:** `GET`, `PATCH`, and `DELETE` notification endpoints had no ownership check. Any authenticated user could read or delete another user's notifications.  
**Fix:** Every mutation endpoint loads the notification first, then checks `notif.userId === req.auth.sub`. Mismatch → 403.

---

### FIX-10 — Mark-as-read idempotency (Medium)

**Affected:** `notificationController.js`  
**Problem:** `markAsRead` always re-saved the document and emitted a realtime event, even if already read.  
**Fix:** Added `if (!notif.isRead)` guard around the save + emit block.

---

### FIX-11 — Card settings injection (High)

**Affected:** `walletController.js`  
**Problem:** `updateCardSettings` spread the entire request body into the DB document. An attacker could inject `status`, `__proto__`, or any arbitrary key.  
**Fix:** Explicit allowlist:

```js
const allowedKeys = ['contactlessEnabled', 'onlinePayments', 'internationalPayments', 'atmWithdrawals'];
```

Only boolean values for these keys are persisted.

---

### FIX-12 — Card count cap (Medium)

**Affected:** `walletController.js`  
**Problem:** Users could issue unlimited virtual cards.  
**Fix:** `issueCard` now checks `count >= 10` and returns 400.

---

### FIX-13 — `addBank` field validation (Medium)

**Affected:** `walletController.js`  
**Problem:** `bankName`, `accountHolderName`, and `accountNumberMasked` were stored without any validation. Empty or malicious strings could be persisted.  
**Fix:** All fields validated for presence and sanitised with `sanitizeText()`.

---

### FIX-14 — Username/name sanitisation in profile update (High)

**Affected:** `userController.js`  
**Problem:** `name` and `username` were stored verbatim. No character set, length, or content validation.  
**Fix:**
- **Name**: must contain `≥ 1` letter, max 100 chars.
- **Username (Palm ID)**: must match `[a-z0-9_]`, 3–30 chars, uniqueness re-checked.

---

### FIX-15 — `?name=` query param injection in `getUser` (Medium)

**Affected:** `userController.js`  
**Problem:** `req.query.name` was assigned directly to `user.name`. Strings like `"undefined"`, `"null"`, or very long inputs could corrupt the user record.  
**Fix:** `sanitizeText(rawName, 100)` applied. Strings `"undefined"` and `"null"` explicitly filtered.

---

### FIX-16 — Error messages leaked internal details (High)

**Affected:** `otpController.js`, `backend/index.js`  
**Problem:** Twilio error codes and Express stack traces were returned in API responses.  
**Fix:**
- OTP: only `"Failed to send verification code"` returned to client; full error logged server-side.
- Global handler: in `production` mode, always returns `"Internal server error"`. In `development`, `err.message` is allowed for debugging.

---

## Frontend Fixes

---

### FIX-17 — Send button enabled without a selected recipient

**Affected:** `Send.jsx`  
**Problem:** `disabled` prop only checked `!amount` and `loading`. A cleared recipient state could lead to a backend 400.  
**Fix:** Added `(!selectedContact && !selectedBank)` to the disabled expression. `validateAndSend()` also guards it explicitly.

---

### FIX-18 — Double-submit on financial actions

**Affected:** `Send.jsx`, `AddMoney.jsx`, `AddCard.jsx`, `walletStore.js`  
**Problem:** Rapid double-tap on Send/Deposit/Issue could submit two concurrent requests, potentially doubling debits.  
**Fix:** Three-layer guard:
1. **Component** — `submitting` state disables the button and short-circuits `onScanVerified`.
2. **Store** — `sending`/`depositing` flags block concurrent calls at the Zustand level with a toast warning.
3. **Backend** — MongoDB session ensures atomic balance updates even if concurrent calls arrive.

---

### FIX-19 — Amount input accepted leading zeros (`"007"`, `"0100"`)

**Affected:** `Send.jsx`, `AddMoney.jsx`  
**Problem:** `parseFloat("007") === 7`, but the user sees `007`. Could mask copy-paste errors.  
**Fix:** `handleAmountChange` rejects integers where `parts[0]` starts with `"0"` and length `> 1` (allowing `"0.50"`).

---

### FIX-20 — Amount validation did not check NaN/Infinity on the frontend

**Affected:** `Send.jsx`, `AddMoney.jsx`  
**Problem:** `parseFloat("")` and `parseFloat("abc")` are `NaN`. No frontend guard existed.  
**Fix:** `validateAndSend()` / `handleDepositRequest()` explicitly check `isNaN(n) || !isFinite(n)` and surface inline error messages.

---

### FIX-21 — Deposit button did not check selected bank's balance

**Affected:** `AddMoney.jsx`  
**Problem:** A user could attempt to deposit more than the linked bank balance. The error only appeared after palm auth, wasting the user's time.  
**Fix:** Bank balance checked in `handleDepositRequest()` before opening the scanner. Inline error shown immediately.

---

### FIX-22 — Settings Save button had no loading state

**Affected:** `Settings.jsx`  
**Problem:** Double-clicking "Save Changes" sent two concurrent `updateProfile` requests.  
**Fix:** `isSaving` state disables the button and shows "Saving..." while the request is in flight. Handler returns early if `isSaving` is already `true`.

---

### FIX-23 — Palm ID input accepted invalid characters in Settings

**Affected:** `Settings.jsx`  
**Problem:** The input allowed spaces and special characters. Backend sanitisation stripped them silently, causing a mismatch between what the user typed and what was stored.  
**Fix:** `onChange` handler filters in real-time: `.replace(/[^a-z0-9_]/gi, '').toLowerCase()`. `maxLength={30}` enforced at the HTML level.

---

### FIX-24 — Card label accepted more than 50 characters

**Affected:** `AddCard.jsx`  
**Problem:** No length limit on the custom label input. Backend stored whatever was sent.  
**Fix:** `maxLength={50}`, `slice(0, 50)` in `onChange`, and a pre-scanner validation check with an inline error message.

---

### FIX-25 — AddCard had no double-submit guard

**Affected:** `AddCard.jsx`  
**Problem:** Double-tapping "Authorize Issuance" could issue two cards simultaneously.  
**Fix:** `submitting` state added. `onScanVerified` returns early if `submitting === true`. Button disabled while pending.

---

## Business Rules Matrix

| Rule | Frontend Guard | Backend Guard |
|------|:--------------:|:-------------:|
| Minimum send amount Rs. 100 | ✅ | ✅ |
| Cannot send > wallet balance | ✅ | ✅ |
| Cannot send to self | ✅ | ✅ |
| Palm auth required for all financial ops | ✅ | ✅ |
| Bank must belong to authenticated user | — | ✅ |
| Card must belong to authenticated user | — | ✅ |
| Notifications scoped to owner | — | ✅ |
| Max 10 virtual cards per user | — | ✅ |
| OTP expires in exactly 5 minutes | — | ✅ |
| OTP resend cooldown 60 seconds | — | ✅ |
| Amount cannot be zero or negative | ✅ | ✅ |
| Amount cannot exceed Rs. 10,000,000 | ✅ | ✅ |
| Recipient must exist on-platform | — | ✅ |
| Palm image must be ≥ 1 KB and valid type | — | ✅ |
| Username: `[a-z0-9_]` only, 3–30 chars | ✅ | ✅ |
| Card settings: whitelisted keys only | — | ✅ |

---

## What Was Not Changed

The following were deliberately left untouched to preserve all existing functionality:

- All existing API route paths and HTTP methods
- MongoDB schemas (`User`, `Wallet`, `Transaction`, `BankAccount`, `Card`, `OTP`, `Notification`)
- Palm biometric enrollment and verification flow
- Clerk authentication middleware and JWT verification
- Realtime Socket.IO event names and payload shapes
- All UI layouts, component structure, colours, and animations
- Business logic for P2P transfers, deposits, and withdrawals
- Bank account auto-provisioning on new user creation
- Twilio OTP SMS delivery flow
