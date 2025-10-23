-- Replace get_user_emails with a more secure, purpose-specific function
-- SECURITY: This function enforces admin authorization at the database level
-- using the authenticated user's session (auth.uid())

-- Drop the overly permissive get_user_emails function
DROP FUNCTION IF EXISTS public.get_user_emails(UUID[]);

-- Create a new function that only returns emails for invite redemptions
-- and only if the caller is an admin of the organization that owns the invite
CREATE OR REPLACE FUNCTION public.get_invite_redemption_emails(p_invite_id UUID)
RETURNS TABLE (user_id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if calling user (from session) is admin of the org that owns this invite
  -- This enforces authorization at the database level
  IF NOT EXISTS (
    SELECT 1
    FROM organization_invites oi
    JOIN organization_members om ON om.organization_id = oi.organization_id
    WHERE oi.id = p_invite_id
      AND om.user_id = auth.uid()
      AND om.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not an admin of the organization';
  END IF;

  -- Return emails only for users who redeemed this specific invite
  RETURN QUERY
  SELECT
    oir.user_id,
    au.email::TEXT
  FROM organization_invite_redemptions oir
  JOIN auth.users au ON au.id = oir.user_id
  WHERE oir.invite_id = p_invite_id
  ORDER BY oir.redeemed_at DESC;
END;
$$;

-- Grant to authenticated users (authorization is checked inside the function)
GRANT EXECUTE ON FUNCTION public.get_invite_redemption_emails(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_invite_redemption_emails IS
'Fetches emails for users who redeemed a specific invite. Authorization enforced internally: only org admins can call this for their org''s invites.';
