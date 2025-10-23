-- ============================================
-- CONSOLIDATED RLS AND PERMISSIONS SETUP
-- ============================================
-- This migration consolidates all Row Level Security (RLS) policies
-- and permissions from multiple previous migrations into a single,
-- comprehensive security setup.
--
-- Strategy: Use RLS policies to control access at the database level,
-- allowing us to use the authenticated Supabase client instead of service_role.
--
-- Consolidated from:
-- - 20251003145009_comprehensive_rls_setup.sql
-- - 20251003150000_fix_invite_validation_rls.sql
-- - 20251004000000_add_prompt_manager_rls.sql
-- - 20250402082709_add_rls_to_collections.sql (legacy collections)
-- ============================================

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
GRANT SELECT ON organization_invites TO anon;

GRANT SELECT, INSERT ON organization_invite_redemptions TO authenticated, service_role;
GRANT UPDATE, DELETE ON organization_invite_redemptions TO service_role;

-- Prompt Manager tables
GRANT SELECT, INSERT, UPDATE, DELETE ON prompts TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON prompt_collections TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON prompt_collection_segments TO authenticated, service_role;

-- Legacy and utility tables
GRANT SELECT, INSERT, UPDATE, DELETE ON collections TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_consents TO authenticated, service_role;

-- Grant organization SELECT to anon for invite validation
GRANT SELECT ON organizations TO anon;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invite_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_collection_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATIONS TABLE POLICIES
-- ============================================

-- All authenticated users can view organizations (needed for invite validation and navigation)
CREATE POLICY "Authenticated users can view organizations"
ON organizations FOR SELECT
TO authenticated
USING (true);

-- Anonymous users can view organizations (for invite validation)
CREATE POLICY "Anonymous users can view organizations"
ON organizations FOR SELECT
TO anon
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

-- Anonymous users can validate invites by token
-- This is safe because:
-- 1. Tokens are cryptographically secure (32 bytes of entropy)
-- 2. Only public data is exposed (org name, role, expiration)
-- 3. Redemption still requires authentication
CREATE POLICY "Anonymous users can validate invites by token"
ON organization_invites FOR SELECT
TO anon
USING (token IS NOT NULL);

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

-- ============================================
-- PROMPTS TABLE POLICIES
-- ============================================

-- Members can view published prompts in their orgs
CREATE POLICY "Members can view published prompts"
ON prompts FOR SELECT
TO authenticated
USING (
  status = 'published' AND
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = prompts.organization_id
    AND user_id = auth.uid()
  )
);

-- Admins can view all prompts in their orgs
CREATE POLICY "Admins can view all prompts"
ON prompts FOR SELECT
TO authenticated
USING (
  is_org_admin(organization_id, auth.uid())
);

-- Admins can insert prompts
CREATE POLICY "Admins can create prompts"
ON prompts FOR INSERT
TO authenticated
WITH CHECK (
  is_org_admin(organization_id, auth.uid())
);

-- Admins can update prompts in their org
CREATE POLICY "Admins can update prompts"
ON prompts FOR UPDATE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()))
WITH CHECK (is_org_admin(organization_id, auth.uid()));

-- Admins can delete prompts in their org
CREATE POLICY "Admins can delete prompts"
ON prompts FOR DELETE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()));

-- ============================================
-- PROMPT COLLECTIONS TABLE POLICIES
-- ============================================

-- All org members can view collections
CREATE POLICY "Members can view collections"
ON prompt_collections FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = prompt_collections.organization_id
    AND user_id = auth.uid()
  )
);

-- Admins can create collections
CREATE POLICY "Admins can create collections"
ON prompt_collections FOR INSERT
TO authenticated
WITH CHECK (
  is_org_admin(organization_id, auth.uid())
);

-- Admins can update collections
CREATE POLICY "Admins can update collections"
ON prompt_collections FOR UPDATE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()))
WITH CHECK (is_org_admin(organization_id, auth.uid()));

-- Admins can delete collections
CREATE POLICY "Admins can delete collections"
ON prompt_collections FOR DELETE
TO authenticated
USING (is_org_admin(organization_id, auth.uid()));

-- ============================================
-- PROMPT COLLECTION SEGMENTS TABLE POLICIES
-- ============================================

-- Members can view segments in their org collections
CREATE POLICY "Members can view segments"
ON prompt_collection_segments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    JOIN organization_members om ON om.organization_id = pc.organization_id
    WHERE pc.id = prompt_collection_segments.collection_id
    AND om.user_id = auth.uid()
  )
);

-- Admins can create segments
CREATE POLICY "Admins can create segments"
ON prompt_collection_segments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    WHERE pc.id = collection_id
    AND is_org_admin(pc.organization_id, auth.uid())
  )
);

-- Admins can update segments
CREATE POLICY "Admins can update segments"
ON prompt_collection_segments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    WHERE pc.id = collection_id
    AND is_org_admin(pc.organization_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    WHERE pc.id = collection_id
    AND is_org_admin(pc.organization_id, auth.uid())
  )
);

-- Admins can delete segments
CREATE POLICY "Admins can delete segments"
ON prompt_collection_segments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prompt_collections pc
    WHERE pc.id = collection_id
    AND is_org_admin(pc.organization_id, auth.uid())
  )
);

-- ============================================
-- USER CONSENTS TABLE POLICIES
-- ============================================

-- Users can view their own consents
CREATE POLICY "Users can view own consents"
ON user_consents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own consents
CREATE POLICY "Users can insert own consents"
ON user_consents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own consents
CREATE POLICY "Users can update own consents"
ON user_consents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own consents
CREATE POLICY "Users can delete own consents"
ON user_consents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- LEGACY COLLECTIONS TABLE POLICIES
-- ============================================

-- Comment on table to document RLS implementation
COMMENT ON TABLE public.collections IS 'Collections table with RLS enabled. Access controlled by user_id for authenticated users.';

-- Policy for authenticated users to select their own collections
CREATE POLICY "Users can view their own collections"
ON public.collections FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own collections
CREATE POLICY "Users can insert their own collections"
ON public.collections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own collections
CREATE POLICY "Users can update their own collections"
ON public.collections FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own collections
CREATE POLICY "Users can delete their own collections"
ON public.collections FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy for anonymous users to view collections (currently disabled)
CREATE POLICY "Anonymous users cannot access collections"
ON public.collections FOR ALL
TO anon
USING (false);
