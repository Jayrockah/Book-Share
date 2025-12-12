# Fix Plan for Phase 1 Issues

## Problem Summary

1. **Books column mismatch**: Code uses `cover_photo_url` but database has `cover_url`
2. **Auth state listener inconsistency**: Doesn't create profile when missing, causing sign-in issues

## Fixes Required

### Fix #1: Align Book Cover Column Name

**Files to change:**
- `src/services/bookService.js` (14 occurrences)
- `src/pages/AddBookPage.jsx` (1 occurrence)

**Change:** Replace all `cover_photo_url` with `cover_url`

**Why:** Database has `cover_url`, not `cover_photo_url`

---

### Fix #2: Make onAuthStateChange Consistent

**File to change:**
- `src/context/AuthContext.jsx` (lines 40-44)

**Change:** If profile doesn't exist after fetching, create it with defaults

**Why:** Prevents user from being logged out when auth state changes

---

## Expected Result After Fixes

✅ User can sign up with email + password
✅ Profile is created in public.users
✅ User can add a book with cover image
✅ Book appears on Discover page from another device
✅ No sign-in loops or spinners
✅ RLS remains strict and secure

## Implementation Order

1. Fix bookService.js (all cover_photo_url → cover_url)
2. Fix AddBookPage.jsx (cover_photo_url → cover_url)
3. Fix AuthContext.jsx onAuthStateChange listener
4. Test signup → add book → discover flow
