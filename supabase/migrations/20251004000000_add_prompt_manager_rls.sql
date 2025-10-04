-- ============================================
-- PROMPT MANAGER RLS POLICIES
-- ============================================
-- This migration adds Row Level Security policies to the prompt manager tables.
-- Implements defense-in-depth security by enforcing access control at the database level.
--
-- Access Rules:
-- - Members: See only published prompts in their orgs
-- - Admins: See all prompts (draft + published) in their orgs
-- - All members: Can view collections and segments
-- - Admins only: Can create/update/delete prompts, collections, segments
-- - Full org isolation: Data only visible within org context

-- ============================================
-- ENABLE RLS ON PROMPT MANAGER TABLES
-- ============================================

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_collection_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

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
