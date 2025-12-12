# Phase 0 Test Plan

## Complete User Flow Test

This document outlines the testing steps for the Phase 0 implementation: "A new user can sign up → complete profile → add a book → see it on Discover from another device"

---

## Prerequisites

1. Development server running: `npm run dev`
2. Supabase project configured with proper environment variables in `.env`
3. Two different browsers or devices for cross-device testing

---

## Test 1: New User Signup Flow

### Steps:
1. Navigate to http://localhost:5173/
2. You should be redirected to `/login` (not logged in)
3. Toggle to "Sign Up" mode
4. Fill in the form:
   - Full Name: Test User
   - City: Lagos (select from dropdown)
   - Email: testuser@example.com
   - Password: password123
5. Click "Sign Up"

### Expected Results:
- ✓ Success toast: "Welcome to Book Share, Test!"
- ✓ Redirect to `/home` (Discover page)
- ✓ User profile created in Supabase `users` table
- ✓ Supabase Auth user created
- ✓ User automatically logged in

### What to Check in Supabase Dashboard:
1. Go to Authentication → Users
   - Should see new user with email `testuser@example.com`
2. Go to Table Editor → users table
   - Should see new row with:
     - firebase_uid: matches Auth user ID
     - name: "Test User"
     - email: "testuser@example.com"
     - city: "Lagos"
     - reputation: 0
     - borrow_limit: 3

---

## Test 2: Add a Book Flow

### Steps:
1. From the Discover page (`/home`), click "Add Book" in navigation
2. You should be on `/add-book`
3. Search for a book: "The Alchemist"
4. Click on the first search result
5. Fill in book details:
   - Condition: Good (default)
   - Genre: Fiction (should auto-populate)
   - Notes: "Great condition, must read!"
6. Click "List Book"

### Expected Results:
- ✓ Success toast: "Book added successfully!"
- ✓ Redirect to `/profile`
- ✓ Book appears in "My Books" section on profile page
- ✓ Book created in Supabase `books` table with status "Available"

### What to Check in Supabase Dashboard:
1. Go to Table Editor → books table
   - Should see new row with:
     - owner_id: matches the user's ID from users table
     - title: "The Alchemist"
     - author: (from Google Books API)
     - genre: "Fiction"
     - condition: "Good"
     - cover_photo: (URL from Google Books)
     - notes: "Great condition, must read!"
     - status: "Available"

---

## Test 3: Cross-Device Discovery

### Steps:
1. Open a DIFFERENT browser or incognito window
2. Navigate to http://localhost:5173/
3. Sign up as a different user:
   - Full Name: Second User
   - City: Abuja
   - Email: seconduser@example.com
   - Password: password456
4. After signup, you should land on `/home` (Discover page)

### Expected Results:
- ✓ Status banner shows "✓ Live Data" (green badge in top right)
- ✓ The book added by Test User appears in the discovery sections:
  - Should appear in "Featured Book of the Week" (if it's the only book)
  - Should appear in "New Arrivals"
  - Should appear in search results
- ✓ Book card shows:
  - Title: "The Alchemist"
  - Owner: Test User
  - City: Lagos
  - Condition: Good
  - Cover photo from Google Books

### What This Proves:
- ✓ Books are stored in Supabase (not localStorage)
- ✓ Books are visible across different sessions/devices
- ✓ Discovery page loads from Supabase by default

---

## Test 4: Sign In Flow

### Steps:
1. Log out from the second user account
2. Navigate to `/login`
3. Enter credentials:
   - Email: testuser@example.com
   - Password: password123
4. Click "Sign In"

### Expected Results:
- ✓ Success toast: "Welcome back, Test!"
- ✓ Redirect to `/home`
- ✓ User state restored from Supabase
- ✓ Profile shows correct user data

---

## Test 5: Fallback UI States

### Test 5a: Supabase Success State
**When:** Supabase loads successfully with books
**Expected:** Green "✓ Live Data" badge visible, no warning banners

### Test 5b: Supabase Empty State
**How to test:**
1. Delete all books from Supabase books table
2. Refresh the page

**Expected:**
- Blue info banner: "No books available yet"
- Message: "Be the first to add a book!"

### Test 5c: Supabase Error State
**How to test:**
1. Temporarily break Supabase connection (invalid API key in .env)
2. Restart dev server
3. Load `/home`

**Expected:**
- Red error banner: "Unable to load online books"
- Falls back to mock/local data if available
- Message: "Books you add will sync when you're back online"

### Test 5d: Mock Data Fallback
**How to test:**
1. Ensure Supabase books table is empty
2. Load `/home` with valid Supabase connection

**Expected:**
- Yellow warning banner: "Using local demo data"
- Message: "Add your first book to see it appear here for others to discover!"
- Mock books from localStorage shown

---

## Success Criteria Summary

All Phase 0 tasks should be verified:

- [x] Users and books live in Supabase only (no localStorage writes for production)
- [x] Basic auth implemented (email) using Supabase Auth
- [x] `AuthContext` uses real auth user, not mock users
- [x] `bookService` reads and writes books via Supabase
- [x] Home page "Discover" list reads from Supabase books by default
- [x] Clear fallback UI when Supabase fails or is empty

**Core Flow Verified:**
✓ New user can sign up
✓ Profile is created in Supabase
✓ User can add a book
✓ Book appears in Supabase
✓ Book is visible on Discover page from another device

---

## Common Issues and Debugging

### Issue: "Unable to load online books" banner always shows

**Possible Causes:**
1. Supabase environment variables not configured
2. RLS (Row Level Security) blocking reads
3. Network connectivity issue

**Solution:**
- Check `.env` file has correct Supabase credentials
- Check Supabase RLS policies allow anonymous reads on `books` table
- Check browser console for specific error messages

### Issue: Book doesn't appear on Discover page

**Possible Causes:**
1. Book added to localStorage instead of Supabase
2. Refresh needed
3. Filters hiding the book

**Solution:**
- Check Supabase books table directly
- Clear search/genre/city filters on Discover page
- Check browser console for errors in `fetchAvailableBooks()`

### Issue: "No user profile found" error

**Possible Causes:**
1. User profile creation failed during signup
2. Mismatch between Auth user ID and profile `firebase_uid`

**Solution:**
- Check Supabase users table for matching `firebase_uid`
- Check browser console for errors in `createUserProfile()`
- Verify no duplicate email constraint violations

---

## Next Steps After Testing

1. If all tests pass, check off Phase 0 items in ROADMAP.md
2. Update CHANGELOG.md with completion date
3. Consider deployment to Vercel/Netlify for public testing
4. Plan Phase 1: Core Borrow and Return Loop
