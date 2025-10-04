-- Organization Invite Links: Enable secure, time-limited invite links for organization onboarding
-- Related to: organization_members table for membership tracking

-- Main invite tracking table
CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT NULL,  -- NULL means unlimited
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  metadata JSONB DEFAULT '{}'::jsonb  -- For future extensibility (IP tracking, user agent, etc.)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS organization_invites_token_idx ON organization_invites(token);
CREATE INDEX IF NOT EXISTS organization_invites_organization_id_idx ON organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS organization_invites_expires_at_idx ON organization_invites(expires_at);
CREATE INDEX IF NOT EXISTS organization_invites_created_by_idx ON organization_invites(created_by);

-- Track invite redemptions for audit trail and analytics
CREATE TABLE IF NOT EXISTS organization_invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES organization_invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  was_new_user BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(invite_id, user_id)
);

-- Indexes for redemptions
CREATE INDEX IF NOT EXISTS organization_invite_redemptions_invite_id_idx ON organization_invite_redemptions(invite_id);
CREATE INDEX IF NOT EXISTS organization_invite_redemptions_user_id_idx ON organization_invite_redemptions(user_id);

-- Add comments for documentation
COMMENT ON TABLE organization_invites IS 'Stores organization invite links with expiration and usage tracking';
COMMENT ON COLUMN organization_invites.token IS 'Cryptographically random token (base64url encoded, 32 bytes entropy)';
COMMENT ON COLUMN organization_invites.max_uses IS 'Maximum number of times this invite can be redeemed (NULL = unlimited)';
COMMENT ON COLUMN organization_invites.current_uses IS 'Current number of redemptions, incremented atomically';
COMMENT ON COLUMN organization_invites.metadata IS 'Extensible field for additional data (IP addresses, rate limiting, etc.)';

COMMENT ON TABLE organization_invite_redemptions IS 'Audit log of invite redemptions for analytics and security';
COMMENT ON COLUMN organization_invite_redemptions.was_new_user IS 'True if user signed up via this invite, false if existing user joined';
