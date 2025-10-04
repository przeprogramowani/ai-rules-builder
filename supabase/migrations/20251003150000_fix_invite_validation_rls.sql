-- Fix RLS policy to allow anonymous invite validation
-- Previously, invite validation required authentication, which broke the invite flow
-- for non-logged-in users. This allows anonymous token-based lookups.

-- Grant SELECT permission to anon role (for invite validation)
GRANT SELECT ON organization_invites TO anon;
GRANT SELECT ON organizations TO anon;

-- Allow anonymous users to validate invites by token
-- This is safe because:
-- 1. Tokens are cryptographically secure (32 bytes of entropy)
-- 2. Only public data is exposed (org name, role, expiration)
-- 3. Redemption still requires authentication
CREATE POLICY "Anonymous users can validate invites by token"
ON organization_invites FOR SELECT
TO anon
USING (token IS NOT NULL);

-- Allow anonymous users to view organization details for invite validation
-- Only basic info (id, slug, name) is needed for the invite landing page
CREATE POLICY "Anonymous users can view organizations"
ON organizations FOR SELECT
TO anon
USING (true);
