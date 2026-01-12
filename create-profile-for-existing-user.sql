-- ==============================================================================
-- Create Profile for Existing User
-- ==============================================================================
-- Run this in Supabase SQL Editor to create a profile for your existing account
-- ==============================================================================

-- Step 1: Check if your user exists and get their ID
SELECT
    id,
    email,
    created_at,
    raw_user_meta_data
FROM auth.users
WHERE email = 'abang.joseph@icloud.com';

-- Copy the 'id' (UUID) from the result above

-- Step 2: Create profile for this user
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from step 1
INSERT INTO public.profiles (id, name, city, created_at)
SELECT
    id,
    COALESCE(raw_user_meta_data->>'name', 'Abang Joseph'),
    COALESCE(raw_user_meta_data->>'city', 'Lagos'),
    created_at
FROM auth.users
WHERE email = 'abang.joseph@icloud.com'
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify the profile was created
SELECT * FROM public.profiles WHERE id = (
    SELECT id FROM auth.users WHERE email = 'abang.joseph@icloud.com'
);

-- ==============================================================================
-- After running this, refresh your browser and sign in again
-- Your profile will now load correctly
-- ==============================================================================
