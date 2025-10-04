-- Create a function to fetch user emails (needed because auth.users is not accessible via views)
-- This function runs with SECURITY DEFINER to access auth.users
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO authenticated;

COMMENT ON FUNCTION public.get_user_emails IS 'Fetches user emails for given user IDs. Used by invite stats and organization member lists.';
