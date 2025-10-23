# Organization Invite Link Implementation Plan

## Executive Summary

This document outlines the implementation plan for an organization invite link system that allows users to create accounts and automatically join an organization (starting with 10xDevs). If a user already has an account, the invite link will add them to the organization.

## 1. Problem Statement & Context

### Current State
- Organizations exist (`organizations` table with 10xDevs seeded)
- Membership tracking exists (`organization_members` table)
- Users must be manually added to organizations
- No self-service mechanism for organization onboarding
- Current access request page directs users to email administrators

### Target State
- Administrators can generate secure, time-limited invite links
- New users can sign up via invite link and auto-join organization
- Existing users can join organization via invite link
- Invite links are trackable and can be revoked
- Single invite token can be used by multiple users (team invite scenario)

### Use Cases
1. **10xDevs cohort onboarding**: Admin generates invite link for course participants
2. **Team expansion**: Existing org admins invite new team members
3. **Self-service access**: Users with invite link don't need manual approval
4. **Existing user activation**: Users who signed up earlier can join org retroactively

## 2. System Architecture

### 2.1 Database Schema

Create new table `organization_invites`:

```sql
CREATE TABLE organization_invites (
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
  metadata JSONB DEFAULT '{}'::jsonb  -- For future extensibility
);

CREATE INDEX organization_invites_token_idx ON organization_invites(token);
CREATE INDEX organization_invites_organization_id_idx ON organization_invites(organization_id);
CREATE INDEX organization_invites_expires_at_idx ON organization_invites(expires_at);

-- Track invite usage
CREATE TABLE organization_invite_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID NOT NULL REFERENCES organization_invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  was_new_user BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(invite_id, user_id)
);

CREATE INDEX organization_invite_redemptions_invite_id_idx ON organization_invite_redemptions(invite_id);
CREATE INDEX organization_invite_redemptions_user_id_idx ON organization_invite_redemptions(user_id);
```

### 2.2 TypeScript Types

Update `src/db/database.types.ts` after migration (via Supabase type generation).

Create `src/types/invites.ts`:

```typescript
export interface OrganizationInvite {
  id: string;
  organizationId: string;
  token: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  maxUses: number | null;
  currentUses: number;
  isActive: boolean;
  role: 'member' | 'admin';
}

export interface InviteValidationResult {
  valid: boolean;
  invite?: OrganizationInvite;
  organization?: {
    id: string;
    slug: string;
    name: string;
  };
  error?: string;
}

export interface InviteRedemptionResult {
  success: boolean;
  alreadyMember?: boolean;
  organizationId?: string;
  organizationName?: string;
  error?: string;
}
```

## 3. Implementation Workstreams

### 3.1 Database Migration

**File**: `supabase/migrations/YYYYMMDDHHMMSS_organization_invites.sql`

**Tasks**:
1. Create `organization_invites` table
2. Create `organization_invite_redemptions` table
3. Add indexes for performance
4. Add comments for documentation
5. Create helper function for token generation (optional, can be done in app code)

**Security Considerations**:
- Use `gen_random_uuid()` + hashing for tokens
- Store only hashed tokens in database (or use cryptographically random strings)
- Enforce cascading deletes to maintain referential integrity

### 3.2 Service Layer

**File**: `src/services/prompt-manager/invites.ts`

**Functions**:

```typescript
// Generate cryptographically secure invite token
export function generateInviteToken(): string

// Create new invite
export async function createOrganizationInvite(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    createdBy: string;
    expiresInDays: number;
    maxUses?: number;
    role: 'member' | 'admin';
  }
): Promise<OrganizationInvite>

// Validate invite token
export async function validateInviteToken(
  supabase: SupabaseClient,
  token: string
): Promise<InviteValidationResult>

// Redeem invite (add user to organization)
export async function redeemInvite(
  supabase: SupabaseClient,
  params: {
    token: string;
    userId: string;
    wasNewUser: boolean;
  }
): Promise<InviteRedemptionResult>

// List organization invites (for admin UI)
export async function listOrganizationInvites(
  supabase: SupabaseClient,
  organizationId: string
): Promise<OrganizationInvite[]>

// Revoke invite
export async function revokeInvite(
  supabase: SupabaseClient,
  inviteId: string
): Promise<void>

// Get invite usage stats
export async function getInviteStats(
  supabase: SupabaseClient,
  inviteId: string
): Promise<{
  totalRedemptions: number;
  newUsers: number;
  existingUsers: number;
}>
```

**Implementation Details**:
- Token generation: Use `crypto.randomBytes(32).toString('base64url')` for URL-safe tokens
- Validation checks: expiry, active status, max uses, organization existence
- Atomic redemption: Use Supabase transactions to prevent race conditions
- Idempotency: Check if user is already a member before inserting

### 3.3 API Endpoints

#### 3.3.1 Admin Endpoints (Create/Manage Invites)

**File**: `src/pages/api/prompts/admin/invites.ts`

**POST** `/api/prompts/admin/invites` - Create invite
- Auth: Required (admin role)
- Body: `{ organizationId, expiresInDays, maxUses?, role }`
- Returns: `{ inviteUrl, token, expiresAt }`

**GET** `/api/prompts/admin/invites?organizationId={id}` - List invites
- Auth: Required (admin role)
- Returns: Array of invites with stats

**File**: `src/pages/api/prompts/admin/invites/[id].ts`

**DELETE** `/api/prompts/admin/invites/{id}` - Revoke invite
- Auth: Required (admin role)
- Returns: `{ success: true }`

**GET** `/api/prompts/admin/invites/{id}/stats` - Get invite stats
- Auth: Required (admin role)
- Returns: Usage statistics

#### 3.3.2 Public Endpoints (Validate/Redeem)

**File**: `src/pages/api/invites/validate.ts`

**POST** `/api/invites/validate` - Validate invite token
- Auth: Not required
- Body: `{ token }`
- Returns: `{ valid, organization?, error? }`

**File**: `src/pages/api/invites/redeem.ts`

**POST** `/api/invites/redeem` - Redeem invite (authenticated user)
- Auth: Required (any authenticated user)
- Body: `{ token }`
- Returns: `{ success, alreadyMember?, organizationName?, error? }`

#### 3.3.3 Modified Signup Endpoint

**File**: `src/pages/api/auth/signup.ts`

**Modifications**:
1. Accept optional `inviteToken` parameter
2. Validate invite token if provided
3. Create user account
4. Automatically add user to organization from invite
5. Record redemption in `organization_invite_redemptions`
6. Return success with organization context

**Enhanced Flow**:
```typescript
1. Validate inviteToken (if provided)
2. Create Supabase auth user
3. Store user consent
4. IF inviteToken:
   a. Add user to organization (redeemInvite)
   b. Return user + organization info
5. ELSE:
   Return user only (existing behavior)
```

### 3.4 UI Components

#### 3.4.1 Admin Invite Management UI

**File**: `src/components/prompt-manager/admin/InviteManager.tsx`

**Features**:
- Button to create new invite
- List of active invites with stats
- Copy invite link to clipboard
- Revoke invite button
- Invite creation modal with options:
  - Expiration (7 days, 30 days, 90 days, custom)
  - Max uses (unlimited, 10, 50, 100, custom)
  - Role (member, admin)

**File**: `src/components/prompt-manager/admin/InviteCreateModal.tsx`

Form for creating invites with validation.

**File**: `src/components/prompt-manager/admin/InviteList.tsx`

Table showing:
- Invite link (with copy button)
- Created by
- Created date
- Expires date
- Uses (current/max)
- Status (active/expired/revoked)
- Actions (copy link, view stats, revoke)

#### 3.4.2 Invite Landing Page

**File**: `src/pages/invites/[token].astro`

**Flow**:
1. Extract token from URL parameter
2. Validate token (server-side)
3. Check if user is authenticated
4. **If authenticated**:
   - Show organization info
   - "Join {Organization}" button → calls redeem endpoint
   - If already member: redirect to prompts
5. **If not authenticated**:
   - Show organization info
   - Modified signup form with pre-filled invite context
   - "Sign up and join {Organization}" button

**File**: `src/components/invites/InviteLanding.tsx`

React component handling the invite acceptance flow.

#### 3.4.3 Modified Signup Component

**File**: `src/components/auth/SignupForm.tsx`

**Modifications**:
1. Accept optional `inviteToken` prop
2. Store invite token in component state
3. Pass invite token to signup API
4. Show organization context if invite token valid
5. Redirect to organization prompts after successful signup

### 3.5 Routing & Navigation

**New Routes**:
- `/invites/{token}` - Invite landing page
- `/prompts/admin/invites` - Admin invite management (new tab/section)

**Modified Routes**:
- `/auth/signup` - Accept `?invite={token}` query param
- `/prompts/request-access` - Show message about requesting invite from admin

### 3.6 Middleware Updates

**File**: `src/middleware/index.ts`

**Changes**:
- Allow `/invites/*` to be accessible without authentication
- Validate invite token in middleware for `/invites/{token}` route
- Attach invite context to `Astro.locals` if valid

## 4. Security Considerations

### 4.1 Token Security
- **Entropy**: Use 256-bit random tokens (32 bytes → base64url encoded)
- **Storage**: Store tokens securely (consider hashing if highly sensitive)
- **Transport**: Always use HTTPS
- **Expiration**: Default 7-day expiration, max 90 days
- **Single-use option**: Support max_uses=1 for sensitive invites

### 4.2 Rate Limiting
- Limit invite creation: 10 invites per admin per hour
- Limit redemption attempts: 5 attempts per IP per hour
- Validation endpoint: 20 requests per IP per minute

### 4.3 Authorization
- Only org admins can create invites for their organization
- Only org admins can view/revoke invites for their organization
- Users cannot redeem invite if already member (idempotent check)

### 4.4 Audit Trail
- Log all invite creations in `organization_invites.metadata`
- Track all redemptions in `organization_invite_redemptions`
- Include IP address and user agent in redemption logs (optional)

## 5. Testing Strategy

### 5.1 Unit Tests

**File**: `tests/unit/services/invites.test.ts`

Test cases:
- `generateInviteToken()` produces unique tokens
- `validateInviteToken()` handles expired tokens
- `validateInviteToken()` handles max uses exceeded
- `redeemInvite()` adds user to organization
- `redeemInvite()` handles already-member case (idempotent)
- `redeemInvite()` increments usage counter atomically

### 5.2 Integration Tests

**File**: `tests/integration/org-invite-flow.test.ts`

Test cases:
- Admin creates invite → receives valid URL
- Unauthenticated user validates invite → sees org info
- New user signs up with invite → auto-joins org
- Existing user redeems invite → joins org
- Expired invite → shows error
- Max uses exceeded → shows error
- Revoked invite → shows error

### 5.3 E2E Tests

**File**: `e2e/org-invites.spec.ts`

Scenarios:
1. **Admin creates invite**:
   - Login as admin
   - Navigate to invite management
   - Create invite with 30-day expiration
   - Copy invite link
   - Verify invite appears in list

2. **New user accepts invite**:
   - Logout
   - Visit invite link
   - See organization name
   - Fill signup form
   - Submit → auto-join org
   - Verify redirect to prompts page
   - Verify access to org prompts

3. **Existing user accepts invite**:
   - Create user without org membership
   - Login
   - Visit invite link
   - Click "Join Organization"
   - Verify membership added
   - Verify access to org prompts

4. **Expired invite handling**:
   - Create invite with past expiration (via DB)
   - Visit invite link
   - See "expired" error message

## 6. Migration & Deployment Plan

### 6.1 Phase 1: Database & Backend (Day 1-2)
1. Create migration file
2. Test migration locally
3. Implement service layer (`invites.ts`)
4. Implement API endpoints
5. Unit test service layer
6. Manual API testing with Postman/curl

### 6.2 Phase 2: Admin UI (Day 3-4)
1. Create admin invite management components
2. Integrate with admin panel
3. Style with existing design system
4. Add copy-to-clipboard functionality
5. Test invite creation flow

### 6.3 Phase 3: Public Invite Flow (Day 4-5)
1. Create invite landing page
2. Modify signup flow to handle invites
3. Create invite acceptance components
4. Handle authenticated vs. unauthenticated states
5. Add error handling and user feedback

### 6.4 Phase 4: Testing & Polish (Day 5-6)
1. Write integration tests
2. Write E2E tests
3. Security review
4. UX review
5. Documentation updates

### 6.5 Phase 5: Deployment (Day 7)
1. Deploy to integration environment
2. Manual QA testing
3. Run E2E test suite
4. Deploy to production
5. Monitor error logs and metrics

## 7. Feature Flags & Rollout

### 7.1 Feature Flag
- Add `ORG_INVITES_ENABLED` feature flag
- Default to `false` in all environments initially
- Enable in `local` and `integration` for testing
- Enable in `prod` after successful QA

### 7.2 Rollout Strategy
1. **Week 1**: Internal testing (development team)
2. **Week 2**: 10xDevs admin testing (create invites, monitor)
3. **Week 3**: Soft launch (share invite with 10-20 users)
4. **Week 4**: Full rollout (public announcement)

### 7.3 Success Metrics
- At least 50 users join via invite links in first month
- <1% invite validation errors (excluding expired/revoked)
- Zero security incidents related to invites
- <2s average invite redemption API response time

## 8. Documentation Updates

### 8.1 User Documentation
- Create `docs/org-invites.md` guide for administrators
- Update `README.md` with invite feature description
- Add invite management to admin panel help text

### 8.2 Developer Documentation
- Update `.ai/prompt-manager/prd.md` with new user stories
- Document invite API endpoints in API reference
- Add invite architecture to `.ai/diagrams/`

### 8.3 Operational Documentation
- Runbook for invite system monitoring
- Troubleshooting guide for common invite issues
- Database query examples for support team

## 9. Edge Cases & Error Handling

### 9.1 Edge Cases
1. **User already member**: Show "already a member" message, redirect to prompts
2. **Invite used concurrently**: Handle race condition with DB constraints
3. **Organization deleted**: Invalidate all invites (CASCADE)
4. **Invite creator deleted**: Keep invite valid (track creator for audit only)
5. **User deletes account then redeems**: Treat as new user
6. **Multiple invites for same org**: Allow, track separately
7. **Expired invite visited**: Show clear expiration message with contact info

### 9.2 Error Messages
- `INVITE_NOT_FOUND`: "This invite link is invalid. Please check the link and try again."
- `INVITE_EXPIRED`: "This invite link has expired. Please request a new invite from your administrator."
- `INVITE_REVOKED`: "This invite link has been revoked. Please contact your administrator."
- `INVITE_MAX_USES`: "This invite link has reached its maximum number of uses. Please request a new invite."
- `ORG_NOT_FOUND`: "The organization for this invite no longer exists."
- `ALREADY_MEMBER`: "You're already a member of this organization."

## 10. Future Enhancements (Out of Scope)

### Phase 2 Enhancements
- **Email invites**: Send invite via email instead of link sharing
- **Bulk invites**: Upload CSV of emails to invite
- **Custom invite messages**: Personalize invite with message
- **Invite templates**: Pre-configured invite settings for common scenarios
- **Invite analytics dashboard**: Detailed usage metrics and charts

### Phase 3 Enhancements
- **Role-based invites**: Different default permissions per invite
- **Time-limited memberships**: Auto-expire membership after N days
- **Conditional invites**: Require email domain match
- **SSO integration**: Bypass signup for SSO-enabled orgs
- **Invite approval flow**: Admin must approve redemptions

## 11. Open Questions & Decisions

### Q1: Should invite tokens be single-use or multi-use by default?
**Decision**: Multi-use by default (maxUses=null), with option for single-use. This supports common use case of sharing one link with course cohort.

### Q2: Should we send confirmation emails after joining via invite?
**Decision**: Phase 1 - No emails, just success message. Phase 2 - Add welcome email with org info.

### Q3: How long should default invite expiration be?
**Decision**: 7 days default, with options for 30/90 days. Max allowed: 1 year.

### Q4: Should we allow invites to grant admin role?
**Decision**: Yes, but show clear warning in UI. Useful for onboarding co-admins.

### Q5: Should existing members be able to use invite links?
**Decision**: No-op with friendly message "You're already a member". Track as redemption but don't modify membership.

### Q6: How to handle users who sign up without email confirmation?
**Decision**: Follow existing Supabase auth flow. If email confirmation required, user must confirm before joining org.

## 12. Success Criteria

### Must Have (MVP)
✓ Admin can create time-limited invite links
✓ New users can sign up via invite and auto-join org
✓ Existing users can join org via invite link
✓ Invites can be revoked by admin
✓ Admin can view list of active invites
✓ Invite links are secure (cryptographically random)
✓ Expired invites show clear error message
✓ System prevents duplicate memberships

### Nice to Have (Post-MVP)
- Copy invite link to clipboard with one click
- Invite usage statistics (redemptions over time)
- Max uses configuration per invite
- Email notifications for invite creators

### Out of Scope (Future)
- Email-based invites (send directly to recipient)
- Bulk invite generation
- Custom onboarding flows per invite
- A/B testing different invite flows

## 13. Risk Assessment & Mitigation

### High Risk: Token Prediction
**Risk**: Weak token generation allows brute force attacks
**Mitigation**: Use crypto.randomBytes(32) for 256-bit entropy, monitor failed validation attempts

### Medium Risk: Expired Invite Usage
**Risk**: Users share expired invites, poor UX
**Mitigation**: Clear expiration warnings, ability to extend/recreate invites

### Medium Risk: Race Conditions
**Risk**: Concurrent redemptions exceed max uses
**Mitigation**: Use atomic DB operations, unique constraints, transactions

### Low Risk: Invite Abuse
**Risk**: Users create too many invites, spam
**Mitigation**: Rate limiting, audit logs, admin monitoring dashboard

## 14. Acceptance Criteria

This feature is considered complete when:

1. ✅ Database migration runs successfully in all environments
2. ✅ Admin can create invite from UI with custom expiration
3. ✅ Invite URL is copyable with single click
4. ✅ New user can visit invite link and sign up
5. ✅ After signup via invite, user has org membership
6. ✅ Existing user can visit invite link and join org
7. ✅ Expired invites show appropriate error
8. ✅ Revoked invites cannot be used
9. ✅ Admin can view list of invites with stats
10. ✅ All unit tests pass (95%+ coverage for invite code)
11. ✅ All integration tests pass
12. ✅ All E2E tests pass
13. ✅ Security review approved
14. ✅ Documentation complete
15. ✅ Feature deployed to production

## 15. Timeline Summary

**Total Estimated Time**: 7-10 working days

- **Day 1**: Database schema, migration, type generation
- **Day 2**: Service layer implementation, API endpoints
- **Day 3**: Admin UI components, invite management
- **Day 4**: Invite landing page, signup flow modifications
- **Day 5**: Testing (unit + integration)
- **Day 6**: E2E tests, security review, polish
- **Day 7**: Documentation, deployment
- **Days 8-10**: Buffer for issues, additional testing

## 16. Implementation Checklist

### Database
- [x] Create `organization_invites` table migration
- [x] Create `organization_invite_redemptions` table migration
- [x] Add indexes for performance
- [ ] Test migration rollback
- [ ] Regenerate TypeScript types (BLOCKED: migration sync issues with Supabase)

### Backend
- [x] Implement `invites.ts` service layer
- [x] Implement admin API endpoints
- [x] Implement public validation/redemption endpoints
- [x] Modify signup endpoint to handle invites
- [x] Add rate limiting to invite endpoints
- [ ] Write unit tests for service layer

### Frontend - Admin
- [x] Create `InvitesAdminPanel` component
- [x] Create `InviteCreateDialog` component
- [x] Create `InvitesList` component
- [x] Add invite management page at `/prompts/admin/invites`
- [x] Implement copy-to-clipboard functionality
- [ ] Add invite stats display (basic stats in list, detail view pending)

### Frontend - Public
- [x] Create invite landing page `/invites/[token].astro`
- [x] Create `InviteLanding` component
- [x] Modify `SignupForm` to accept invite token
- [x] Add invite context display to signup page
- [x] Handle authenticated vs. unauthenticated states
- [x] Implement error handling and user feedback

### Testing
- [ ] Write unit tests for `invites.ts`
- [ ] Write integration tests for invite flow
- [ ] Write E2E tests for admin creation
- [ ] Write E2E tests for new user signup
- [ ] Write E2E tests for existing user join
- [ ] Test expired/revoked invite handling
- [ ] Security penetration testing

### Documentation
- [ ] Update PRD with invite user stories
- [ ] Create admin guide for invite management
- [ ] Document API endpoints
- [ ] Update README with invite feature
- [ ] Create operational runbook
- [ ] Document troubleshooting steps

### Deployment
- [ ] Deploy migration to integration
- [ ] Enable feature flag in integration
- [ ] Run QA testing in integration
- [ ] Deploy to production
- [ ] Enable feature flag in production
- [ ] Monitor logs and metrics
- [ ] Announce feature to users

---

## Implementation Progress (2025-10-03)

### ✅ Completed

**Database Layer:**
- Created migration file: `supabase/migrations/20251003000000_organization_invites.sql`
- Tables: `organization_invites`, `organization_invite_redemptions`
- Indexes for token lookup, organization filtering, expiration checks
- Comments and documentation in SQL

**Type Definitions:**
- `src/types/invites.ts` - Complete TypeScript interfaces for invites
- Error codes and messages defined
- Service parameter types

**Service Layer:**
- `src/services/prompt-manager/invites.ts` - Full implementation with:
  - `generateInviteToken()` - Cryptographically secure token generation
  - `createOrganizationInvite()` - Create new invites
  - `validateInviteToken()` - Validate invite with full checks
  - `redeemInvite()` - Atomic redemption with idempotency
  - `listOrganizationInvites()` - Fetch invites for admin panel
  - `revokeInvite()` - Mark invites as inactive
  - `getInviteStats()` - Usage statistics

**API Endpoints:**
- `src/pages/api/prompts/admin/invites.ts` - POST (create), GET (list)
- `src/pages/api/prompts/admin/invites/[id].ts` - DELETE (revoke)
- `src/pages/api/prompts/admin/invites/[id]/stats.ts` - GET (stats)
- `src/pages/api/invites/validate.ts` - POST (public validation)
- `src/pages/api/invites/redeem.ts` - POST (authenticated redemption)
- Modified `src/pages/api/auth/signup.ts` - Added inviteToken parameter

**Admin UI Components:**
- `src/components/prompt-manager/admin/InvitesAdminPanel.tsx` - Main panel
- `src/components/prompt-manager/admin/InvitesList.tsx` - Table with status badges
- `src/components/prompt-manager/admin/InviteCreateDialog.tsx` - Creation modal
- `src/pages/prompts/admin/invites.astro` - Admin page route

**Public UI Components:**
- `src/components/invites/InviteLanding.tsx` - Invite acceptance page
- `src/pages/invites/[token].astro` - Public invite route
- Modified `src/components/auth/SignupForm.tsx` - Accept invite tokens
- Modified `src/pages/auth/signup.astro` - Extract invite from query params
- Modified `src/services/auth.ts` - Pass invite to signup API
- Modified `src/hooks/useAuth.ts` - Support invite parameter

**Middleware Updates:**
- Added `/invites/*` to public paths
- Added `/api/invites/validate` to public API paths
- Added rate limiting for invite endpoints (10 seconds)

### ⚠️ Blocked

**Database Migration Sync:**
- Migration file created locally but cannot sync to remote due to Supabase CLI migration history mismatch
- Error: Remote migrations `20251001181600` and `20251001182224` not in local directory
- Attempted repair commands succeeded partially but connection timeouts occurred
- **Action Required:** Manual migration sync/repair needed before testing

### 📋 Remaining Tasks

**Immediate (Post-Migration):**
1. Resolve migration sync issues
2. Push migration to Supabase
3. Regenerate TypeScript types with `npx supabase gen types typescript`
4. Manual testing of full invite flow
5. Add login page handling for invite redirects (currently only signup handles it)

**Short-term:**
1. Unit tests for invite service layer
2. Integration tests for API endpoints
3. Add invite stats detail view
4. Add navigation link to invites page in admin UI
5. Feature flag for invite system

**Long-term:**
1. Documentation and runbooks
2. Production deployment
3. Monitoring and analytics
4. E2E tests for invite flows

### 🗂️ Files Created/Modified

**Created:**
- `supabase/migrations/20251003000000_organization_invites.sql`
- `src/types/invites.ts`
- `src/services/prompt-manager/invites.ts`
- `src/pages/api/prompts/admin/invites.ts`
- `src/pages/api/prompts/admin/invites/[id].ts`
- `src/pages/api/prompts/admin/invites/[id]/stats.ts`
- `src/pages/api/invites/validate.ts`
- `src/pages/api/invites/redeem.ts`
- `src/components/prompt-manager/admin/InvitesAdminPanel.tsx`
- `src/components/prompt-manager/admin/InvitesList.tsx`
- `src/components/prompt-manager/admin/InviteCreateDialog.tsx`
- `src/pages/prompts/admin/invites.astro`
- `src/components/invites/InviteLanding.tsx`
- `src/pages/invites/[token].astro`

**Modified:**
- `src/middleware/index.ts` - Public paths and rate limiting
- `src/pages/api/auth/signup.ts` - Invite token support
- `src/components/auth/SignupForm.tsx` - Invite parameter
- `src/pages/auth/signup.astro` - Extract invite from URL
- `src/services/auth.ts` - Pass invite to API
- `src/hooks/useAuth.ts` - Support invite parameter

### 🔍 Known Issues

1. **Migration sync error** - Requires manual intervention
2. **Login page** - Does not yet handle invite token query parameter (needs redirect after login)
3. **No atomic counter** - Using basic increment, should add DB function for true atomicity
4. **No feature flag** - System is always enabled once migrated
5. **No stats detail page** - Only basic stats shown in list view

---

## Notes & Assumptions

1. **Supabase Auth**: Assumes current Supabase auth setup remains unchanged
2. **Email Confirmation**: Follows existing email confirmation flow (if enabled)
3. **10xDevs Focus**: Initial implementation focuses on 10xDevs org, but supports multi-org
4. **No RLS**: Following existing pattern of middleware-based auth (no RLS in phase 1)
5. **Existing Design System**: Reuses existing UI components and styling
6. **No Email Sending**: Phase 1 only generates shareable links, no email integration

## References

- Existing auth flow: `src/pages/api/auth/signup.ts`
- Password reset token pattern: `src/hooks/useTokenHashVerification.ts`
- Organization service: `src/services/prompt-manager/organizations.ts`
- Phase 2 implementation: `.ai/prompt-manager/phase-2-impl-plan.md`
- Database schema: `supabase/migrations/20250413093000_prompt_manager_orgs.sql`
