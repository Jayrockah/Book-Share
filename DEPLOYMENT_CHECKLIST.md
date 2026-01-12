# Deployment Checklist - Book Share Rebuild

Complete these steps in order to deploy the rebuilt architecture.

## Pre-Deployment

- [ ] **Backup existing database** (if any data exists)
  - Go to Supabase Dashboard → Database → Backups
  - Create manual backup

- [ ] **Review REBUILD_GUIDE.md**
  - Understand what changed
  - Review new architecture

## Database Setup

- [ ] **Run complete rebuild script**
  1. Open https://supabase.com/dashboard
  2. Select Book Share project
  3. Go to SQL Editor
  4. Click "New Query"
  5. Copy **ALL** contents of `supabase-COMPLETE-REBUILD.sql`
  6. Paste and run (Cmd+Enter)
  7. Wait 15-30 seconds
  8. Should see: "🎉 DATABASE REBUILD SUCCESSFUL!"

- [ ] **Verify schema applied**
  ```sql
  -- Check profiles table exists
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_name = 'profiles';
  -- Should return: 1

  -- Check trigger exists
  SELECT COUNT(*) FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';
  -- Should return: 1
  ```

- [ ] **Test RLS policies**
  ```sql
  -- Check policies exist
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public';
  -- Should return multiple rows
  ```

## Code Setup

- [ ] **Remove Firebase dependency**
  ```bash
  npm uninstall firebase
  ```

- [ ] **Install dependencies**
  ```bash
  npm install
  ```

- [ ] **Verify environment variables**
  - Open `.env` file
  - Confirm `VITE_SUPABASE_URL` is set
  - Confirm `VITE_SUPABASE_ANON_KEY` is set
  - Remove any Firebase env vars

- [ ] **Start dev server**
  ```bash
  npm run dev
  ```
  - Should start without errors
  - Should NOT see "Missing Supabase credentials" error

## Testing

### Auth Testing

- [ ] **Sign Up Flow**
  1. Navigate to signup page
  2. Enter email, password, name, city
  3. Click sign up
  4. Check for success message or email confirmation prompt
  5. Verify in Supabase Dashboard:
     - Go to Authentication → Users
     - New user should appear
     - Go to Database → profiles table
     - New profile should appear with same ID

- [ ] **Sign In Flow**
  1. Navigate to login page
  2. Enter credentials
  3. Sign in
  4. Should redirect to home page
  5. User info should appear in UI
  6. Check browser console - no errors

- [ ] **Session Persistence**
  1. Sign in
  2. Refresh page
  3. Should still be signed in
  4. Close browser
  5. Reopen and visit app
  6. Should still be signed in

- [ ] **Sign Out Flow**
  1. Click sign out
  2. Should redirect to login
  3. Refresh page
  4. Should stay on login (not auto-sign in)

### Features Testing

- [ ] **Add Book**
  1. Sign in
  2. Go to Add Book page
  3. Fill in book details
  4. Submit
  5. Should succeed without errors
  6. Book should appear in database
  7. Book should link to your profile ID

- [ ] **View Books**
  1. Go to home page
  2. Books should load
  3. Owner information should display
  4. No console errors

- [ ] **Community Page**
  1. Go to community page
  2. Users should load
  3. Profile info should display

- [ ] **Profile Update**
  1. Go to profile page
  2. Update name or city
  3. Save
  4. Should succeed
  5. Refresh page
  6. Changes should persist

## Performance Testing

- [ ] **Page Load Speed**
  - Home page loads in < 2 seconds
  - No infinite loading spinners
  - Auth init completes in < 5 seconds

- [ ] **Database Queries**
  - Check Supabase Dashboard → Logs
  - No slow query warnings
  - RLS policies working (queries only return allowed data)

## Error Testing

- [ ] **Invalid Credentials**
  - Try to sign in with wrong password
  - Should show error message
  - Should NOT crash app

- [ ] **Network Error Simulation**
  - Disable internet
  - Try to sign in
  - Should show timeout/network error
  - Enable internet
  - Should work again

- [ ] **Missing Profile Edge Case**
  - Sign in as user
  - Manually delete profile from database
  - Refresh app
  - Should handle gracefully (not crash)

## Browser Testing

- [ ] **Chrome** - All features work
- [ ] **Safari** - All features work
- [ ] **Firefox** - All features work
- [ ] **Mobile Safari** - All features work
- [ ] **Mobile Chrome** - All features work

## Production Readiness

- [ ] **Environment Variables**
  - Production `.env` has correct Supabase URL
  - No Firebase env vars present
  - Anon key is correct (not service key!)

- [ ] **Build Test**
  ```bash
  npm run build
  ```
  - Should complete without errors
  - Check `dist` folder exists

- [ ] **Preview Build**
  ```bash
  npm run preview
  ```
  - Should start production server
  - Test auth flows in production build

## Security Checklist

- [ ] **RLS Enabled**
  - All tables have RLS enabled
  - Policies tested and working
  - Users can't access other users' private data

- [ ] **Auth Flow Secure**
  - Passwords not logged
  - Tokens stored securely in localStorage
  - PKCE flow enabled (check supabaseClient.js)

- [ ] **API Keys Safe**
  - Using anon key (not service role key)
  - Anon key is in `.env` (not committed to git)
  - `.env` is in `.gitignore`

## Documentation

- [ ] **REBUILD_GUIDE.md** - Complete and accurate
- [ ] **README.md** - Updated with new setup instructions
- [ ] **Code comments** - Auth flow documented

## Rollback Plan

If something goes wrong:

1. **Database Rollback**
   - Go to Supabase → Database → Backups
   - Restore pre-deployment backup

2. **Code Rollback**
   ```bash
   git log  # Find commit before rebuild
   git revert <commit-hash>
   ```

3. **Reinstall Firebase** (if needed)
   ```bash
   npm install firebase
   ```

## Post-Deployment Monitoring

### First 24 Hours

- [ ] Monitor Supabase Dashboard → Logs for errors
- [ ] Check authentication success rate
- [ ] Monitor database query performance
- [ ] Watch for user-reported issues

### First Week

- [ ] Review auth error logs
- [ ] Check for any RLS policy violations
- [ ] Monitor page load times
- [ ] Gather user feedback

## Success Criteria

✅ **Deployment is successful when:**

1. Users can sign up without errors
2. Users can sign in without errors
3. Sessions persist across page refreshes
4. Books can be added without schema errors
5. No "firebase_uid" or "users table" errors
6. Auth initialization completes in < 10 seconds
7. No login issues after deployment
8. All features work as before

---

**Current Status:** Ready for Deployment

**Last Updated:** January 12, 2026

**Deployed By:** _____________

**Deployment Date:** _____________

**Notes:**
