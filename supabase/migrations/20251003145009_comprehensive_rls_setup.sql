-- ============================================
-- COMPREHENSIVE RLS AND PERMISSIONS SETUP
-- ============================================
-- This migration sets up proper Row Level Security (RLS) and permissions
-- for the entire application after the remote_schema migration revoked all permissions.
--
-- Strategy: Use RLS policies to control access at the database level,
-- allowing us to use the authenticated Supabase client instead of service_role.

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user is admin of an organization
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND organization_members.user_id = is_org_admin.user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic invite usage increment
CREATE OR REPLACE FUNCTION increment_invite_usage(invite_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE organization_invites
  SET current_uses = current_uses + 1
  WHERE id = invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT BASE PERMISSIONS
-- ============================================
-- Grant necessary table permissions to authenticated and service_role roles

-- Organization tables
GRANT SELECT ON organizations TO authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON organizations TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON organization_members TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON organization_invites TO authenticated, service_role;

GRANT SELECT, INSERT ON organization_invite_redemptions TO authenticated, service_role;
GRANT UPDATE, DELETE ON organization_invite_redemptions TO service_role;

-- Prompt Manager tables
GRANT SELECT, INSERT, UPDATE, DELETE ON prompts TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON prompt_collections TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON prompt_collection_segments TO authenticated, service_role;

-- Legacy and utility tables
GRANT SELECT, INSERT, UPDATE, DELETE ON collections TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_consents TO authenticated, service_role;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invite_redemptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================

-- All authenticated users can view organizations (needed for invite validation and navigation)
CREATE POLICY "Authenticated users can view organizations"
ON organizations FOR SELECT
TO authenticated
USING (true);

-- Only org admins can update their organizations
CREATE POLICY "Org admins can update their organizations"
ON organizations FOR UPDATE
TO authenticated
USING (is_org_admin(id, auth.uid()))
WITH CHECK (is_org_admin(id, auth.uid()));

-- ============================================
-- ORGANIZATION_MEMBERS TABLE POLICIES
-- ============================================

-- Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
ON organization_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Org admins can view all members of their orgs
CREATE POLICY "Org admins can view all members"
ON organization_members FOR SELECT
TO authenticated
USING (is_org_admin(organization_id, auth.uid()));

-- Users can add themselves as members (for invite redemption)
CREATE POLICY "Users can add themselves as members"
ON organization_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own membership or admins can update any
CREATE POLICY "Users can update own membership or admins can update"
ON organization_members FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR is_org_admin(organization_id, auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  OR is_org_admin(organization_id, auth.uid())
);

-- Users can delete their own membership or admins can delete any
CREATE POLICY "Users can delete own membership or admins can delete"
ON organization_members FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR is_org_admin(organization_id, auth.uid())
);

-- ============================================
-- ORGANIZATION_INVITES TABLE POLICIES
-- ============================================

-- Org admins can create invites for their organizations
CREATE POLICY "Org admins can create invites"
ON organization_invites FOR INSERT
TO authenticated
WITH CHECK (is_org_admin(organization_id, auth.uid()));

-- Users can view invites for orgs they admin, OR anyone can view by token (for validation)
CREATE POLICY "Users can view invites for their orgs or by token"
ON organization_invites FOR SELECT
TO authenticated
USING (
  is_org_admin(organization_id, auth.uid())
  OR token IS NOT NULL  -- Allow token-based lookup for validation
);

-- Org admins can update invites for their organizations
CREATE POLICY "Org admins can update invites"
ON organization_invites FOR UPDATE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()))
WITH CHECK (is_org_admin(organization_id, auth.uid()));

-- Org admins can delete invites for their organizations
CREATE POLICY "Org admins can delete invites"
ON organization_invites FOR DELETE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()));

-- ============================================
-- ORGANIZATION_INVITE_REDEMPTIONS POLICIES
-- ============================================

-- Users can record their own redemptions
CREATE POLICY "Users can record their own redemptions"
ON organization_invite_redemptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Org admins can view redemptions for their org's invites
CREATE POLICY "Org admins can view redemptions"
ON organization_invite_redemptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_invites
    WHERE organization_invites.id = invite_id
    AND is_org_admin(organization_invites.organization_id, auth.uid())
  )
);
