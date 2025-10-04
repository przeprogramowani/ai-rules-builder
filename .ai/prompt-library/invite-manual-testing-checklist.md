# Organization Invite System - Manual Testing Checklist

This checklist covers all manual testing scenarios for the organization invite system implementation.

## Prerequisites

- [ ] Database migration `20251003000000_organization_invites.sql` has been applied
- [ ] Feature flag `orgInvites` is enabled in local environment
- [ ] At least one organization exists (e.g., 10xDevs)
- [ ] At least one admin user exists for the organization

## Test Setup

### Create Test Users

Create these test users for comprehensive testing:

1. **Admin User** - Has admin role in test organization
   - Email: `admin@test.com`
   - Purpose: Create and manage invites

2. **New User** - Does not have an account yet
   - Email: `newuser@test.com`
   - Purpose: Test signup flow with invite

3. **Existing User** - Has an account but not in organization
   - Email: `existinguser@test.com`
   - Purpose: Test login and join flow

## 1. Admin Invite Creation Flow

### Test 1.1: Access Admin Invite Page
- [ ] Log in as admin user
- [ ] Navigate to `/prompts/admin`
- [ ] Verify "Invites" tab is visible in admin navigation
- [ ] Click "Invites" tab
- [ ] Verify redirected to `/prompts/admin/invites`
- [ ] Verify page shows "Invite Management" header
- [ ] Verify organization selector is visible

### Test 1.2: Create Basic Invite
- [ ] Click "Create Invite Link" button
- [ ] Verify invite creation dialog opens
- [ ] Set expiration to "7 days"
- [ ] Set max uses to "Unlimited"
- [ ] Set role to "member"
- [ ] Click "Create Invite"
- [ ] Verify dialog closes
- [ ] Verify new invite appears in the list
- [ ] Verify invite has "Active" status badge
- [ ] Verify invite shows correct expiration date (7 days from now)
- [ ] Verify invite shows "0 / ∞" usage

### Test 1.3: Create Limited Invite
- [ ] Click "Create Invite Link" button
- [ ] Set expiration to "30 days"
- [ ] Set max uses to "10"
- [ ] Set role to "admin"
- [ ] Click "Create Invite"
- [ ] Verify new invite appears with "0 / 10" usage
- [ ] Verify role badge shows "admin" with purple styling

### Test 1.4: Copy Invite Link
- [ ] Locate an active invite in the list
- [ ] Click the copy button next to the invite URL
- [ ] Verify checkmark icon appears briefly
- [ ] Paste the copied URL into a text editor
- [ ] Verify URL format: `http://localhost:3000/invites/{token}`
- [ ] Verify token is a long alphanumeric string

## 2. Invite Validation Flow

### Test 2.1: Valid Invite (Not Logged In)
- [ ] Open invite URL in incognito/private browser window
- [ ] Verify page loads without errors
- [ ] Verify "You're Invited!" heading is displayed
- [ ] Verify organization name is shown (e.g., "10xDevs")
- [ ] Verify "What happens next?" section is visible
- [ ] Verify "Sign Up and Join" button is visible
- [ ] Verify "Already have an account? Log in" link is present

### Test 2.2: Valid Invite (Logged In, Not Member)
- [ ] Log in as existing user (not in organization)
- [ ] Open invite URL
- [ ] Verify "Join Organization" heading is displayed
- [ ] Verify organization name is shown
- [ ] Verify "Join {Organization}" button is visible
- [ ] Verify role information is displayed

### Test 2.3: Expired Invite
- [ ] As admin, create an invite with 1-day expiration
- [ ] Manually update `expires_at` in database to be in the past
- [ ] Open invite URL in new browser window
- [ ] Verify "Invalid Invite" error page is shown
- [ ] Verify "expired" error message is displayed
- [ ] Verify red error styling

### Test 2.4: Revoked Invite
- [ ] As admin, create a new invite
- [ ] Copy the invite URL
- [ ] Click "Revoke" button for that invite
- [ ] Confirm revocation
- [ ] Verify invite status changes to "Revoked"
- [ ] Open the invite URL in new browser window
- [ ] Verify error page with "revoked" message is shown

### Test 2.5: Max Uses Exceeded
- [ ] As admin, create an invite with max uses = 1
- [ ] Copy the invite URL
- [ ] Redeem the invite once (see section 3)
- [ ] Verify usage shows "1 / 1"
- [ ] Try to open the invite URL in a new browser window
- [ ] Verify "Max Uses" error is shown

## 3. New User Signup Flow

### Test 3.1: Signup with Valid Invite
- [ ] Open valid invite URL in incognito window
- [ ] Click "Sign Up and Join" button
- [ ] Verify redirected to `/auth/signup?invite={token}`
- [ ] Verify signup form is displayed
- [ ] Verify organization context is shown (e.g., "Join 10xDevs")
- [ ] Fill in email: `newuser@test.com`
- [ ] Fill in password: secure password
- [ ] Accept terms and conditions
- [ ] Complete captcha verification
- [ ] Click "Sign up" button
- [ ] Verify redirected to prompts page (or org-specific page)
- [ ] Verify user is now logged in
- [ ] Navigate to organization prompts
- [ ] Verify user can access organization content

### Test 3.2: Email Confirmation (if enabled)
- [ ] Follow steps in 3.1
- [ ] If email confirmation is required, verify:
  - [ ] Confirmation email is sent
  - [ ] User must confirm email before accessing org
  - [ ] After confirmation, user is added to organization

## 4. Existing User Login Flow

### Test 4.1: Login with Invite Link
- [ ] Open valid invite URL in incognito window
- [ ] Click "Already have an account? Log in" link
- [ ] Verify redirected to `/auth/login?invite={token}`
- [ ] Enter existing user credentials
- [ ] Complete captcha
- [ ] Click "Sign in"
- [ ] Verify redirected back to invite page `/invites/{token}`
- [ ] Verify "Join Organization" button is shown
- [ ] Click "Join {Organization}" button
- [ ] Verify success message or redirect
- [ ] Verify user can now access organization content

### Test 4.2: Direct Login then Invite
- [ ] Log in as existing user (not in org)
- [ ] Open invite URL while logged in
- [ ] Click "Join {Organization}" button
- [ ] Verify immediate redirect or success message
- [ ] Verify user can access organization content

## 5. Invite Redemption Flow

### Test 5.1: First Redemption
- [ ] Create new invite with max uses = 5
- [ ] Copy invite URL
- [ ] Note initial usage: "0 / 5"
- [ ] Redeem invite as new user (section 3)
- [ ] Return to admin invites page
- [ ] Click "Refresh" button
- [ ] Verify usage updated to "1 / 5"

### Test 5.2: Multiple Redemptions
- [ ] Use same invite from 5.1
- [ ] Redeem as 2 more different users
- [ ] Verify usage updates to "3 / 5"
- [ ] Verify all 3 users can access organization

### Test 5.3: Already Member (Idempotent)
- [ ] Log in as user who already joined via invite
- [ ] Open same invite URL again
- [ ] Click "Join" button
- [ ] Verify friendly "already a member" message
- [ ] Verify no error occurs
- [ ] Verify user still has access

## 6. Invite Statistics Flow

### Test 6.1: View Invite Stats
- [ ] As admin, go to invites page
- [ ] Find invite with multiple redemptions
- [ ] Click "Stats" button
- [ ] Verify stats dialog opens
- [ ] Verify "Total Redemptions" count is correct
- [ ] Verify "New Users" count matches actual new signups
- [ ] Verify "Existing Users" count is correct
- [ ] Verify "New User Conversion Rate" is calculated correctly
- [ ] Verify progress bar visualization is shown
- [ ] Click "Close" button
- [ ] Verify dialog closes

### Test 6.2: Stats for Unused Invite
- [ ] Create new invite that hasn't been used
- [ ] Click "Stats" button
- [ ] Verify "No Redemptions Yet" message is shown
- [ ] Verify all counts show 0

## 7. Admin List and Management

### Test 7.1: List All Invites
- [ ] As admin, navigate to invites page
- [ ] Verify all created invites are listed
- [ ] Verify invites sorted by creation date (newest first)
- [ ] Verify each invite shows:
  - [ ] Truncated invite URL with copy button
  - [ ] Status badge (Active/Expired/Revoked)
  - [ ] Role badge (member/admin)
  - [ ] Usage (current / max)
  - [ ] Expiration date
  - [ ] Stats and Revoke buttons

### Test 7.2: Filter by Status
- [ ] Create invites with different statuses:
  - [ ] Active invite
  - [ ] Expired invite (manually expire)
  - [ ] Revoked invite
- [ ] Verify status badges are color-coded:
  - [ ] Active = green
  - [ ] Expired = red
  - [ ] Revoked = gray

### Test 7.3: Revoke Invite
- [ ] Click "Revoke" button on an active invite
- [ ] Verify confirmation prompt appears
- [ ] Click "Confirm"
- [ ] Verify invite status changes to "Revoked"
- [ ] Verify "Revoke" button is now disabled
- [ ] Try to use revoked invite URL
- [ ] Verify error message is shown

## 8. Feature Flag Testing

### Test 8.1: Feature Enabled
- [ ] Verify `orgInvites` feature flag is `true` in local env
- [ ] Verify "Invites" tab appears in admin panel
- [ ] Verify `/invites/{token}` routes are accessible
- [ ] Verify `/prompts/admin/invites` is accessible

### Test 8.2: Feature Disabled
- [ ] Set `orgInvites` feature flag to `false`
- [ ] Restart development server
- [ ] Navigate to `/prompts/admin`
- [ ] Verify "Invites" tab does NOT appear
- [ ] Try to access `/prompts/admin/invites` directly
- [ ] Verify redirected away (to `/prompts`)
- [ ] Try to access `/invites/{token}` directly
- [ ] Verify redirected to home page
- [ ] Re-enable feature flag for remaining tests

## 9. Edge Cases and Error Handling

### Test 9.1: Invalid Token Format
- [ ] Manually visit `/invites/invalid-short-token`
- [ ] Verify error page is shown
- [ ] Verify "invalid" or "not found" error message

### Test 9.2: Non-Existent Token
- [ ] Visit `/invites/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`
- [ ] Verify "invite not found" error is shown

### Test 9.3: Organization Deleted
- [ ] Create invite for an organization
- [ ] Delete the organization from database
- [ ] Try to access invite URL
- [ ] Verify appropriate error is shown

### Test 9.4: Network Errors
- [ ] Open browser dev tools
- [ ] Set network to "Offline" mode
- [ ] Try to validate an invite
- [ ] Verify loading state is shown
- [ ] Verify error message when request fails
- [ ] Set network back to "Online"
- [ ] Verify retry works

### Test 9.5: Concurrent Redemptions
- [ ] Create invite with max uses = 1
- [ ] Open invite URL in 2 different browsers simultaneously
- [ ] Click "Join" button in both browsers at the same time
- [ ] Verify only one redemption succeeds
- [ ] Verify the other shows "max uses exceeded" error

## 10. UI/UX Testing

### Test 10.1: Responsive Design
- [ ] Test invite pages on different screen sizes:
  - [ ] Desktop (1920x1080)
  - [ ] Tablet (768x1024)
  - [ ] Mobile (375x667)
- [ ] Verify layouts adapt appropriately
- [ ] Verify buttons are accessible
- [ ] Verify text is readable

### Test 10.2: Dark Mode (if applicable)
- [ ] Switch to dark mode
- [ ] Verify invite pages have proper contrast
- [ ] Verify status badges are visible
- [ ] Verify dialogs have proper background

### Test 10.3: Accessibility
- [ ] Navigate invites page with keyboard only (Tab, Enter)
- [ ] Verify all interactive elements are reachable
- [ ] Verify screen reader announcements (if tested)
- [ ] Verify form labels are associated with inputs

## 11. Performance Testing

### Test 11.1: Large Invite List
- [ ] Create 50+ invites
- [ ] Load invites admin page
- [ ] Verify page loads in reasonable time (<2s)
- [ ] Verify scrolling is smooth
- [ ] Verify no performance degradation

### Test 11.2: Stats Loading
- [ ] Create invite with 100+ redemptions (via database)
- [ ] Click "Stats" button
- [ ] Verify stats load in reasonable time
- [ ] Verify calculations are correct

## 12. Security Testing

### Test 12.1: Authorization Checks
- [ ] Log in as non-admin user
- [ ] Try to access `/prompts/admin/invites`
- [ ] Verify redirected or access denied
- [ ] Try to POST to `/api/prompts/admin/invites`
- [ ] Verify 401/403 error

### Test 12.2: Token Security
- [ ] Create multiple invites
- [ ] Verify each token is unique
- [ ] Verify tokens are sufficiently long (>40 chars)
- [ ] Verify tokens use URL-safe characters only
- [ ] Verify tokens are not sequential or guessable

### Test 12.3: SQL Injection Protection
- [ ] Try to create invite with malicious SQL in fields:
  - Organization ID: `'; DROP TABLE invites; --`
- [ ] Verify request is rejected or sanitized
- [ ] Verify no database damage occurs

## Summary Checklist

After completing all tests above, verify:

- [ ] All test scenarios passed
- [ ] No console errors in browser
- [ ] No server errors in logs
- [ ] Database integrity maintained
- [ ] All UI components render correctly
- [ ] All API endpoints return expected responses
- [ ] Feature flag controls work as expected
- [ ] Security measures are effective

## Post-Testing Actions

- [ ] Document any bugs found in GitHub issues
- [ ] Update implementation plan with any deviations
- [ ] Create list of improvements for phase 2
- [ ] Prepare deployment plan for production
- [ ] Update user documentation with screenshots

---

**Testing Notes:**

- Date tested: ___________
- Tester: ___________
- Environment: ___________
- Issues found: ___________
- Pass rate: _____ / _____ tests
