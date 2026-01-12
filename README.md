# Book Share - Community Book Lending Platform

A React-based platform for sharing books within local communities, built with Supabase backend.

## 🚨 FOR AI ASSISTANTS: READ FIRST

**CRITICAL: When debugging issues in this project, NEVER GUESS. ALWAYS DIAGNOSE WITH DATA.**

Before proposing any fix:
1. **Request actual error data**: Browser console, Network tab, SQL query results
2. **Measure, don't assume**: Add timing logs, check actual API responses
3. **Verify with queries**: Check if data exists, verify RLS policies, confirm schema
4. **Ask for diagnostics**: "Run this SQL", "Check Network tab", "Show me the console output"

See `.claude_instructions` for full debugging methodology.

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase credentials

# Run development server
npm run dev
```

## Architecture

### Authentication
- **Supabase Auth** (Firebase removed as of Jan 2026)
- Automatic profile creation via database trigger
- Session-based with JWT tokens

### Database Schema
- `profiles` table (linked to `auth.users`) - NOT `users` table
- RLS enabled on all tables
- Policies use `auth.uid()` for access control

### Key Files
- `src/context/AuthContext.jsx` - Authentication state management
- `src/context/DataContext.jsx` - App-wide data management
- `src/services/supabaseClient.js` - Single Supabase client instance
- `src/services/bookService.js` - Book CRUD operations
- `src/services/userService.js` - User/profile operations

## Database Setup

### Initial Setup (New Database)
```sql
-- Run in Supabase SQL Editor
-- File: supabase-FINAL-REBUILD.sql
```

### Fix RLS Issues (Existing Database)
```sql
-- Run in Supabase SQL Editor
-- File: FINAL-FIX.sql
```

### Create Profile for Pre-Rebuild Account
```sql
-- Run in Supabase SQL Editor
-- File: create-profile-for-existing-user.sql
```

## Common Issues & Solutions

### "Could not load user profile"
**Cause**: Either profile doesn't exist OR RLS blocking query
**Fix**:
1. Check if profile exists: `SELECT * FROM profiles WHERE id = 'user-id'`
2. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'profiles'`
3. Run `create-profile-for-existing-user.sql` if profile missing
4. Run `FINAL-FIX.sql` if RLS blocking

### Auth Initialization Hangs
**Cause**: Database query hanging (usually RLS or network)
**Debug**:
1. Open Network tab in browser
2. Look for Supabase API requests
3. Check response status and body
4. Add timing logs: `performance.now()` before/after queries

### Session Stuck in Loop
**Fix**:
```javascript
// In browser console
localStorage.clear();
// Then refresh page
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── context/        # React Context providers (Auth, Data)
├── pages/          # Route components
├── services/       # API/database service layers
└── config/         # Configuration files

supabase-*.sql      # Database migration scripts
REBUILD_GUIDE.md    # Detailed rebuild documentation
DEPLOYMENT_CHECKLIST.md  # Production deployment steps
```

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Documentation

- `REBUILD_GUIDE.md` - Complete architecture and rebuild documentation
- `QUICK_START.md` - Quick reference for common tasks
- `DEPLOYMENT_CHECKLIST.md` - Production deployment steps
- `.claude_instructions` - AI assistant debugging methodology

## Contributing

When working on this project:
1. Always diagnose with actual data, never guess
2. Add timing logs for performance measurement
3. Test authentication flow after changes
4. Verify RLS policies don't block legitimate queries

## License

[Add your license here]
