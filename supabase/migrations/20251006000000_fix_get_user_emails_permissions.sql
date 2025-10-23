-- Fix get_user_emails function permissions for production
-- Issue: Function was failing in production because SECURITY DEFINER wasn't properly
-- accessing auth.users. This migration ensures proper ownership and permissions.

-- Drop and recreate with explicit postgres role ownership
DROP FUNCTION IF EXISTS public.get_user_emails(UUID[]);

-- Create function with explicit security settings
CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids UUID[])
RETURNS TABLE (id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email::TEXT
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Ensure function is owned by postgres (superuser) for auth access
ALTER FUNCTION public.get_user_emails(UUID[]) OWNER TO postgres;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO authenticated;

-- Also grant to anon and service_role for completeness
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO service_role;

COMMENT ON FUNCTION public.get_user_emails IS 'Fetches user emails for given user IDs. SECURITY DEFINER allows access to auth.users. Function owned by postgres for proper auth schema access.';
