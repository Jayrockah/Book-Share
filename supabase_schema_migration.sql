-- Book Share - Complete Schema Migration
-- Run this in Supabase SQL Editor to add missing columns

-- =====================================================
-- USERS TABLE - Add missing columns
-- =====================================================

-- WARNING: This will delete existing test data to fix type mismatches
-- Only run this in development! Comment out if you have real user data.

-- Clear existing test data (contains invalid UUID values like "test-user-1")
TRUNCATE TABLE users CASCADE;

-- Ensure firebase_uid is UUID type (not TEXT)
DO $$
BEGIN
    -- If firebase_uid is TEXT, convert it to UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'firebase_uid'
        AND data_type = 'text'
    ) THEN
        -- Now safe to convert since table is empty
        ALTER TABLE users ALTER COLUMN firebase_uid TYPE UUID USING firebase_uid::uuid;
    END IF;
END $$;

-- Add reputation column (defaults to 0)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reputation DECIMAL(3,2) DEFAULT 0;

-- Add borrow_limit column (defaults to 3)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS borrow_limit INTEGER DEFAULT 3;

-- Add admin flag (defaults to false)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Add banned flag (defaults to false)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Add profile photo URL (optional)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Add timestamps if not exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- BOOKS TABLE - Ensure all columns exist
-- =====================================================

-- Add notes column if missing
ALTER TABLE books
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add timestamps if not exist
ALTER TABLE books
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE books
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- INDEXES for better query performance
-- =====================================================

-- Index on firebase_uid for faster user lookups
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);

-- Index on owner_id for book queries
CREATE INDEX IF NOT EXISTS idx_books_owner_id ON books(owner_id);

-- Index on status for available books queries
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);

-- Index on city for location-based discovery
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

-- Composite index for available books by city
CREATE INDEX IF NOT EXISTS idx_books_status_owner ON books(status, owner_id);

-- =====================================================
-- UPDATE TRIGGER - Auto-update updated_at timestamp
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for books table
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Enable and set policies
-- =====================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can read available books" ON books;
DROP POLICY IF EXISTS "Users can insert own books" ON books;
DROP POLICY IF EXISTS "Users can update own books" ON books;
DROP POLICY IF EXISTS "Users can delete own books" ON books;

-- Users can read all profiles
CREATE POLICY "Users can read all profiles"
    ON users FOR SELECT
    TO authenticated, anon
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid()::uuid = firebase_uid::uuid);

-- Enable RLS on books table
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Anyone can read available books
CREATE POLICY "Anyone can read available books"
    ON books FOR SELECT
    TO authenticated, anon
    USING (true);

-- Users can insert their own books (check against users table)
CREATE POLICY "Users can insert own books"
    ON books FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = owner_id
            AND users.firebase_uid::uuid = auth.uid()::uuid
        )
    );

-- Users can update their own books (check against users table)
CREATE POLICY "Users can update own books"
    ON books FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = owner_id
            AND users.firebase_uid::uuid = auth.uid()::uuid
        )
    );

-- Users can delete their own books (check against users table)
CREATE POLICY "Users can delete own books"
    ON books FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = owner_id
            AND users.firebase_uid::uuid = auth.uid()::uuid
        )
    );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify the migration worked:

-- Check users table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- ORDER BY ordinal_position;

-- Check books table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'books'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('users', 'books');

-- Check RLS policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('users', 'books');
