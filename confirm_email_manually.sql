-- =============================================
-- MANUALLY CONFIRM EMAIL FOR DEVELOPMENT
-- =============================================
-- Run this in Supabase SQL Editor to confirm your email without clicking the link

-- Update only email_confirmed_at (NOT confirmed_at - that's auto-generated)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'abang.joseph@icloud.com';

-- Verify it worked
SELECT
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users
WHERE email = 'abang.joseph@icloud.com';
