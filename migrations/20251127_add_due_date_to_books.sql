-- Migration: Add due_date column to books table
-- Date: 2025-11-27
-- Purpose: Fix frontend 400 error - books.due_date column does not exist

ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.books.due_date IS 'Due date for borrowed books. NULL when book is available.';
