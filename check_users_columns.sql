-- Query to check all columns that exist in the users table
-- Run this in your Supabase SQL Editor

SELECT
    table_schema,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY table_schema, ordinal_position;

-- Alternative query to see just the column names
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- AND table_schema = 'public'
-- ORDER BY ordinal_position;
