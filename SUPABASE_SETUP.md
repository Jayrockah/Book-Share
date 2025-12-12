# Supabase Setup Guide

## Quick Fix for Current Error

The error `"could not find the 'borrow_limit' column of 'users' in the schema cache"` means your Supabase tables are missing some columns. Follow these steps:

---

## Step 1: Run the Schema Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase_schema_migration.sql` from your project
6. Paste it into the SQL editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

This will:
- Add missing columns to your `users` and `books` tables
- Set up proper indexes for performance
- Configure Row Level Security (RLS) policies
- Add auto-update triggers for timestamps

---

## Step 2: Verify the Migration

After running the migration, verify it worked by running these queries in the SQL Editor:

```sql
-- Check users table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

You should see these columns in the `users` table:
- `id` (uuid, primary key)
- `firebase_uid` (text) - links to Supabase Auth
- `name` (text)
- `email` (text)
- `city` (text)
- `preferences` (text[] or jsonb)
- `reputation` (numeric) - NEW
- `borrow_limit` (integer) - NEW
- `is_admin` (boolean) - NEW
- `is_banned` (boolean) - NEW
- `profile_photo` (text) - NEW
- `created_at` (timestamp)
- `updated_at` (timestamp)

```sql
-- Check books table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'books'
ORDER BY ordinal_position;
```

You should see these columns in the `books` table:
- `id` (uuid, primary key)
- `owner_id` (uuid, foreign key to users.id)
- `title` (text)
- `author` (text)
- `genre` (text)
- `condition` (text)
- `cover_photo` (text)
- `status` (text)
- `due_date` (date)
- `notes` (text) - NEW
- `created_at` (timestamp)
- `updated_at` (timestamp)

---

## Step 3: Test the Application

1. Restart your development server (if running):
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:5173/

3. Test the signup flow:
   - Click "Sign Up"
   - Enter your details
   - Submit the form

4. **The error should be gone!** You should be redirected to the home page.

---

## Row Level Security (RLS) Policies

The migration sets up these security policies:

### Users Table:
- ✓ **Read**: Anyone can read all user profiles (needed for discovery)
- ✓ **Update**: Users can only update their own profile

### Books Table:
- ✓ **Read**: Anyone can read all books (needed for discovery)
- ✓ **Insert**: Users can only insert books they own
- ✓ **Update**: Users can only update their own books
- ✓ **Delete**: Users can only delete their own books

---

## Understanding the Schema

### Users Table
The `users` table stores application user profiles and links to Supabase Auth via `firebase_uid`:

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (PK)     │ ← Referenced by books.owner_id
│ firebase_uid│ ← Links to Supabase Auth user
│ name        │
│ email       │
│ city        │
│ reputation  │
│ ...         │
└─────────────┘
```

### Books Table
The `books` table stores book listings:

```
┌──────────────┐
│    books     │
├──────────────┤
│ id (PK)      │
│ owner_id (FK)│ ← Points to users.id
│ title        │
│ author       │
│ genre        │
│ status       │
│ ...          │
└──────────────┘
```

---

## Common Issues

### Issue: "relation 'users' does not exist"
**Solution**: You need to create the tables first. Make sure you've run the initial table creation SQL.

### Issue: RLS policy errors when inserting books
**Solution**: The migration includes proper RLS policies that join the `users` table to verify ownership. Make sure the migration ran completely.

### Issue: "duplicate key value violates unique constraint"
**Solution**: You may be trying to create a user with an email that already exists. Check your `users` table or use a different email.

---

## Next Steps

After the migration completes successfully:

1. Follow the test plan in `PHASE_0_TEST_PLAN.md`
2. Test user signup → add book → cross-device discovery
3. Check off Phase 1 items in ROADMAP.md

---

## Need Help?

If you encounter issues:

1. Check the Supabase logs: Dashboard → Logs
2. Check browser console for error details
3. Verify your `.env` file has correct credentials:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
