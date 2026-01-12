# Quick Start - Deploy Rebuilt Architecture

Follow these **exact steps** to deploy your new auth system.

---

## Step 1: Apply Database Schema (5 minutes)

### Go to Supabase Dashboard

1. Open in browser: **https://supabase.com/dashboard**
2. Click on your **Book Share** project
3. In left sidebar, click **SQL Editor**
4. Click the green **"New Query"** button

### Run the Rebuild Script

5. On your computer, open the file: **`supabase-COMPLETE-REBUILD.sql`**
6. Press **Cmd+A** (select all) then **Cmd+C** (copy)
7. Go back to Supabase SQL Editor in browser
8. Click in the query editor and press **Cmd+V** (paste)
9. Click the green **"Run"** button (or press **Cmd+Enter**)
10. **Wait 15-30 seconds** while it runs

### Verify Success

You should see at the bottom of the output:

```
✅ Tables created: 11
✅ Triggers created: 3
✅ RLS Policies created: 21
🎉 DATABASE REBUILD SUCCESSFUL!
```

**If you see this** → Database setup is complete! ✅

**If you see an error** → Copy the exact error message and share it.

---

## Step 2: Install Dependencies (1 minute)

Open Terminal in your project folder and run:

```bash
npm install
```

This removes Firebase and ensures all dependencies are up to date.

---

## Step 3: Start Development Server (1 minute)

In Terminal, run:

```bash
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open browser:** http://localhost:5173

---

## Step 4: Test Authentication (5 minutes)

### Test Sign Up

1. Go to signup page in your app
2. Enter:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
   - City: `Lagos`
3. Click **Sign Up**
4. Should either:
   - Sign you in immediately, OR
   - Show "Check your email to confirm"

### Verify in Supabase

1. Go to Supabase Dashboard
2. Click **Authentication** in left sidebar
3. Click **Users** tab
4. You should see your test user with the email you entered

5. Click **Database** in left sidebar
6. Click **Table Editor**
7. Select **profiles** table
8. You should see a profile with:
   - Same `id` as the user
   - Name: "Test User"
   - City: "Lagos"

**If you see both the user AND the profile** → Auto-creation is working! ✅

### Test Sign In

1. Sign out if you're signed in
2. Go to login page
3. Enter the same credentials
4. Click **Sign In**
5. Should sign you in successfully

### Test Session Persistence

1. While signed in, refresh the page (F5)
2. Should stay signed in (not redirected to login)
3. Close the browser completely
4. Reopen browser and go to app
5. Should still be signed in

**If all these work** → Authentication is fully working! ✅

---

## Step 5: Test Book Features (2 minutes)

### Add a Book

1. Sign in
2. Go to "Add Book" page
3. Fill in:
   - Title: "Test Book"
   - Author: "Test Author"
   - Genre: "Fiction"
   - Condition: "Good"
4. Submit
5. Should succeed without errors

### View Books

1. Go to home page
2. Your book should appear in the list
3. Owner name should show your profile name
4. No errors in browser console (press F12 to check)

**If this works** → Book system is working! ✅

---

## Expected Results Summary

After completing all steps, you should have:

✅ Database with 11 tables (profiles, books, etc.)
✅ Database trigger that auto-creates profiles
✅ 21 RLS policies protecting your data
✅ Zero Firebase dependencies
✅ Users can sign up successfully
✅ Profiles auto-created on signup
✅ Users can sign in and stay signed in
✅ Books can be added without errors
✅ No "firebase_uid" errors
✅ No "users table" errors
✅ No login issues after making changes

---

## Troubleshooting

### Error: "Missing Supabase credentials"

**Fix:**
1. Check file `.env` exists in project root
2. Open `.env` and verify these lines exist:
   ```
   VITE_SUPABASE_URL=https://bvhgqhxwwgkhwzcazsih.supabase.co
   VITE_SUPABASE_ANON_KEY=your_key_here
   ```
3. Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### Error: "relation profiles does not exist"

**Fix:** You didn't run the database script or it failed
1. Go back to Step 1 and run `supabase-COMPLETE-REBUILD.sql` again
2. It's safe to run multiple times

### Sign up succeeds but profile not created

**Fix:** Database trigger not working
1. In Supabase SQL Editor, run:
   ```sql
   SELECT trigger_name
   FROM information_schema.triggers
   WHERE event_object_table = 'users'
     AND trigger_schema = 'auth';
   ```
2. Should return: `on_auth_user_created`
3. If empty, run the rebuild script again

### Books page shows "Unknown Owner"

**Fix:** RLS policy or foreign key issue
1. In Supabase SQL Editor, run:
   ```sql
   SELECT * FROM public.books
   JOIN public.profiles ON books.owner_id = profiles.id;
   ```
2. If this works, problem is in your code
3. If this fails, re-run rebuild script

### Can't sign in after signing out

**Fix:** Check browser console (F12) for errors
1. Look for red error messages
2. Most common: "Invalid login credentials"
   - Make sure you're using the correct password
   - Supabase may require email confirmation
3. Check Supabase Dashboard → Auth → Users
   - User should have "Confirmed" status

---

## Next Steps

Once everything is working:

1. **Delete test user** (if you want):
   - Supabase Dashboard → Auth → Users
   - Click on test user → Delete

2. **Create your real account**:
   - Sign up with your real email
   - This will be your admin account

3. **Read the full documentation**:
   - `REBUILD_GUIDE.md` - Architecture details
   - `DEPLOYMENT_CHECKLIST.md` - Production deployment

4. **Start building features!**
   - Your auth is now solid
   - No more login issues when making changes
   - Clean architecture to build on

---

## Summary

**What you just did:**

- ❌ Removed Firebase (complexity eliminated)
- ✅ Set up Supabase-only auth (simple & robust)
- ✅ Created profiles table with auto-creation trigger
- ✅ Set up RLS policies for security
- ✅ Tested complete auth flow
- ✅ Verified books integration

**What this means:**

You can now make changes to your app without breaking authentication. The single-system architecture with automatic profile creation means no more sync failures, no more schema mismatches, and no more login issues.

**Build with confidence!** 🚀
