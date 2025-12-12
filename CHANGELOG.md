# Change Log

## 2025-11-26: Phase 1 - Supabase Auth & Books Implementation

**Core User Flow Completed:** New users can sign up → complete profile → add a book → see it on Discover from another device

### Changes:

**Authentication & User Management:**
- Replaced mock login system with Supabase Auth (email/password)
- `AuthContext.jsx`: Full rewrite to use real Supabase Auth with session persistence
- `LoginPage.jsx`: Email/password form with sign up/sign in toggle (replaced mock user picker)
- `userService.js`: Added `createUserProfile()`, `getUserProfile()`, `updateUserProfile()`

**Book Management:**
- `bookService.js`: Added `createBook()` to save books to Supabase with owner reference
- `AddBookPage.jsx`: Updated to use Supabase `createBook()` service (books now persist in cloud)

**Discovery & Fallback UI:**
- `HomePage.jsx`: Prioritizes Supabase books with intelligent fallback to mock data
- Added clear status banners:
  - ✓ Green "Live Data" badge when using Supabase successfully
  - ⚠️ Red error banner when Supabase fails to load
  - 📡 Yellow warning when using local demo data
  - 📚 Blue info when Supabase is empty (encourages adding first book)

**Testing:**
- Created `PHASE_0_TEST_PLAN.md` with comprehensive test scenarios

### What Works Now:
- Real user signup with profile creation in Supabase
- Email/password authentication with session persistence
- Books saved to Supabase and visible across devices
- Discovery page loads from Supabase by default
- Graceful fallback to mock data with user notification

### What's Still Mock:
- Borrow transactions (still in MockDatabase)
- Clubs and messaging
- User discovery and search

---

## 2025-11-26: Google Books Ratings Enhancement

- Ratings added to mock data and balanced across users. Home sorted by rating. SeedData rebuilt.
