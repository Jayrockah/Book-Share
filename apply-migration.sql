-- ============================================================
-- CRITICAL MIGRATION: Add due_date column to books table
-- ============================================================
-- Purpose: Fix "column books.due_date does not exist" error
-- Date: 2025-11-27
-- Status: REQUIRED - Frontend will fail without this
-- ============================================================

-- Add the missing due_date column
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

-- Add documentation
COMMENT ON COLUMN public.books.due_date IS 'Due date for borrowed books. NULL when book is Available.';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'books'
  AND column_name = 'due_date';

-- Expected output:
-- column_name | data_type                   | is_nullable
-- ------------+-----------------------------+-------------
-- due_date    | timestamp with time zone    | YES
