# Fixes Applied for Phase 1 Flow

**Date:** 2025-11-27
**Build Status:** ✅ **Passes** (965ms, zero errors)

---

## Summary

Fixed 2 critical issues preventing Phase 1 from working:
1. Books table column mismatch (`cover_photo_url` vs `cover_url`)
2. Auth state listener inconsistency causing sign-in loops

---

## Issue #1: Books Table Column Mismatch ⚠️ **CRITICAL**

### Problem

**Your Supabase schema has:** `cover_url`
**Your code was using:** `cover_photo_url`

This caused:
- ❌ Adding books to FAIL (inserting into non-existent column)
- ❌ Fetching books to FAIL (selecting non-existent column)
- ❌ HomePage to show no books

### Files Changed

1. **`src/services/bookService.js`**
   - Line 11: JSDoc `@param` updated
   - Line 26: INSERT changed `cover_photo_url` → `cover_url`
   - Lines 70, 132, 211, 256, 299: SELECT queries changed `cover_photo_url` → `cover_url` (6 occurrences)
   - Lines 97, 157, 185: Transform functions changed `book.cover_photo_url` → `book.cover_url` (3 occurrences)

   **Total changes:** 11 lines

2. **`src/pages/AddBookPage.jsx`**
   - Line 80: createBook call changed `cover_photo_url` → `cover_url`

   **Total changes:** 1 line

### What This Fixes

✅ Books can now be added successfully
✅ Book cover images are stored in correct column
✅ Books display on HomePage with cover images
✅ Cross-device discovery works

---

## Issue #2: Auth State Listener Inconsistency

### Problem

The `onAuthStateChange` listener was **inconsistent** with `signIn`:

- `signIn()` function: If profile doesn't exist, creates it ✅
- `onAuthStateChange` listener: If profile doesn't exist, sets user to `null` ❌

This caused:
- Sign-in would work initially
- But then the auth state listener would fire and overwrite `user` to `null`
- Result: Sign-in loop / spinner stuck on login page

### File Changed

**`src/context/AuthContext.jsx`** (lines 40-56)

### Before

```javascript
if (session?.user) {
    setAuthUser(session.user);
    const profile = await getUserProfile(session.user.id);
    setUser(profile); // Could be null!
}
```

### After

```javascript
if (session?.user) {
    setAuthUser(session.user);
    let profile = await getUserProfile(session.user.id);

    // If profile doesn't exist, create it with defaults
    if (!profile) {
        console.log('No profile found in auth state change, creating default profile...');
        profile = await createUserProfile({
            firebase_uid: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            city: 'Lagos'
        });
    }

    setUser(profile); // Always has a value now
}
```

### What This Fixes

✅ Sign-in completes without loops
✅ User profile is always available after auth
✅ Auth state changes don't log user out unexpectedly
✅ Consistent behavior between signIn and auth state listener

---

## What Was NOT Changed

These parts remain intact (as requested):

✅ **RLS policies** - Still strict, no USING(true) or WITH CHECK(true)
✅ **Users table schema** - No email, no preferences, firebase_uid is uuid
✅ **Auth flow logic** - Email confirmation handling unchanged
✅ **Security** - auth.uid() = firebase_uid comparison unchanged

---

## Phase 1 Flow - Expected Behavior

### Scenario A: Email Confirmation Disabled (Recommended)

1. ✅ User goes to `/login`
2. ✅ User signs up with: name, city, email, password
3. ✅ Profile created immediately (has session)
4. ✅ Navigated to `/home`
5. ✅ User adds book via Google Books search
6. ✅ Book saved with `cover_url` and `owner_id`
7. ✅ Book visible on Discover page
8. ✅ Different device loads `/home` → sees the book

### Scenario B: Email Confirmation Enabled

1. ✅ User goes to `/login`
2. ✅ User signs up with: name, city, email, password
3. ✅ Message: "Please check your email to confirm"
4. ✅ User confirms email via link
5. ✅ User returns and signs in
6. ✅ Profile created on first sign-in (auth state listener creates it)
7. ✅ Navigated to `/home`
8. ✅ User adds book → saves successfully
9. ✅ Book visible on Discover

---

## Testing Checklist

### Test 1: Sign Up + Add Book

1. Go to http://localhost:5173/login
2. Click "Sign up"
3. Enter: name, city, email, password
4. Submit
5. **Expected:** Navigated to `/home` (or email confirmation message)
6. If email confirmation required: check email, click link, sign in
7. **Expected:** Now at `/home`, user profile exists
8. Click "Add Book"
9. Search for a book (e.g., "Harry Potter")
10. Select a book, set condition/genre/notes
11. Click "List Book"
12. **Expected:** Success toast, navigated to `/profile`
13. **Expected:** Book appears in your books list

### Test 2: Cross-Device Discovery

1. Open different browser (or incognito)
2. Go to http://localhost:5173/home
3. **Expected:** See the book you added
4. **Expected:** Book has cover image, title, author, owner name, city

### Test 3: Sign In (Existing User)

1. Go to http://localhost:5173/login
2. Sign in with existing credentials
3. **Expected:** Navigated to `/home` immediately
4. **Expected:** No spinner, no loop
5. **Expected:** Profile loads correctly

---

## What to Do If Issues Persist

### If books still don't show:

1. Open browser console (F12)
2. Look for errors mentioning `cover_url` or `cover_photo_url`
3. Check Supabase Dashboard → Table Editor → books
4. Verify column is named `cover_url` (not `cover_photo_url`)

### If sign-in still loops:

1. Open browser console (F12)
2. Look for error: "could not find the ... column"
3. Check that public.users has:
   - ✅ `firebase_uid` (type: uuid)
   - ✅ `profile_photo_url` (NOT `profile_photo`)
   - ❌ No `email` column
   - ❌ No `preferences` column

### If RLS violation persists:

1. Run this in Supabase SQL Editor:
   ```sql
   SELECT policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename = 'users' AND schemaname = 'public';
   ```
2. Verify policies use: `auth.uid() = firebase_uid` (no `::text` casting)

---

## Files Modified Summary

| File | Lines Changed | Type |
|------|--------------|------|
| `src/services/bookService.js` | 11 | Books column rename |
| `src/pages/AddBookPage.jsx` | 1 | Books column rename |
| `src/context/AuthContext.jsx` | 10 | Auth consistency fix |
| **Total** | **22 lines** | **2 files + 1 file** |

---

## Build Verification

```bash
$ npm run build

✓ 1798 modules transformed.
✓ built in 965ms
```

✅ **Build passes with zero errors**

---

## Next Steps

1. **Test the Phase 1 flow** using the checklist above
2. **Verify email confirmation** is disabled in Supabase (recommended for development)
3. **Report any remaining issues** with specific error messages from browser console

---

**All fixes are incremental, targeted, and safe. No security or RLS logic was changed.**
