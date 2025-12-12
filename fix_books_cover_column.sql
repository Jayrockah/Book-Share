-- =============================================
-- FIX BOOKS TABLE - ADD MISSING cover_url COLUMN
-- =============================================
-- Run this in Supabase SQL Editor

-- Step 1: Drop any ghost columns that might exist
-- (This clears schema cache corruption)
ALTER TABLE public.books DROP COLUMN IF EXISTS cover_photo;
ALTER TABLE public.books DROP COLUMN IF EXISTS cover_photo_url;
ALTER TABLE public.books DROP COLUMN IF EXISTS coverPhoto;
ALTER TABLE public.books DROP COLUMN IF EXISTS cover_image;
ALTER TABLE public.books DROP COLUMN IF EXISTS image_url;

-- Step 2: Add the correct column
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Step 3: Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'books'
AND table_schema = 'public'
AND column_name LIKE '%cover%'
ORDER BY column_name;

-- Step 4: (Optional) Migrate any existing data if you had a different column name
-- Uncomment and modify if you had data in a different column:
-- UPDATE public.books SET cover_url = old_column_name WHERE old_column_name IS NOT NULL;
-- ALTER TABLE public.books DROP COLUMN old_column_name;

-- Step 5: Verify the full books schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'books'
AND table_schema = 'public'
ORDER BY ordinal_position;
