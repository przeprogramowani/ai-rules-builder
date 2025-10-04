-- Manually confirm user email for local development
-- Usage: Replace 'user@example.com' with the actual email address
-- This bypasses email confirmation which doesn't work on localhost

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com'
  AND email_confirmed_at IS NULL;

-- Verify the update
SELECT
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'user@example.com';
