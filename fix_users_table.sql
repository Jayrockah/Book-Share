-- =============================================
-- FIX PUBLIC.USERS TABLE SCHEMA MISMATCHES
-- =============================================
-- Run this in Supabase SQL Editor to align the database with our code
-- IMPORTANT: We are modifying public.users (not auth.users)

-- CRITICAL ISSUE #1: firebase_uid type mismatch
-- Database has: firebase_uid UUID
-- Our code sends: authData.user.id (string)
-- RLS policy needs: Both sides to match types

-- Fix: Drop and recreate RLS policies with proper casting
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Recreate policies with proper type casting (UUID = UUID, no text conversion)
CREATE POLICY "Users are viewable by everyone" ON public.users
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = firebase_uid);

CREATE POLICY "Users can insert own profile" ON public.users
FOR INSERT WITH CHECK (auth.uid() = firebase_uid);

-- ISSUE #2: profile_photo should be profile_photo_url
ALTER TABLE public.users RENAME COLUMN profile_photo TO profile_photo_url;

-- ISSUE #3: Remove unused columns (optional - only if you don't need them)
-- Uncomment these if you want to clean up:
-- ALTER TABLE users DROP COLUMN IF EXISTS state;
-- ALTER TABLE users DROP COLUMN IF EXISTS country;
-- ALTER TABLE users DROP COLUMN IF EXISTS reputation_score;
-- ALTER TABLE users DROP COLUMN IF EXISTS tokens;
-- ALTER TABLE users DROP COLUMN IF EXISTS locked_tokens;

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;
