-- ==============================================================================
-- FINAL FIX - Diagnose and Fix Auth Issues
-- ==============================================================================

-- Step 1: Check if your profile exists
SELECT
    'Profile Check' as test,
    id,
    name,
    city,
    created_at
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'abang.joseph@icloud.com');

-- Step 2: Check current RLS policies on profiles
SELECT
    'Current RLS Policies' as test,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Step 3: FIX - Drop all existing policies and create correct ones
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create correct policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Step 4: Verify fix worked
SELECT
    'Verification' as test,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ==============================================================================
-- After running this:
-- 1. Check Step 1 output - if no rows, profile doesn't exist (run create-profile-for-existing-user.sql)
-- 2. Check Step 4 output - should show 3 policies
-- 3. Clear session in browser and try logging in
-- ==============================================================================
