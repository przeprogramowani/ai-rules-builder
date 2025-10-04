# Database Sync Plan

**Date Created:** 2025-10-03
**Status:** Ready for execution
**Risk Level:** 🟡 Medium-Low

## Problem Analysis

### Remote Database State
- ✅ **Has:** `collections` table (from migration 20250328135512)
- ✅ **Has:** `user_consents` table (from migration 20250411083417)
- ❌ **Missing:** `organizations`, `organization_members` (should exist from migration 20250413093000)
- ❌ **Missing:** `prompt_collections`, `prompt_collection_segments`, `prompts` (should exist from 20251001211923)
- ❌ **Missing:** Localization columns in prompts table (from 20251002100000)
- ❌ **Missing:** `organization_invites`, `organization_invite_redemptions` (from 20251003000000)

### Migration History Analysis

```
Local          | Remote         | Time (UTC)
----------------|----------------|---------------------
20250328135512 | 20250328135512 | 2025-03-28 13:55:12  ✅ Applied (collections)
20250328201010 | 20250328201010 | 2025-03-28 20:10:10  ✅ Applied (drop RLS)
20250402082709 | 20250402082709 | 2025-04-02 08:27:09  ✅ Applied (RLS policies)
20250411083417 | 20250411083417 | 2025-04-11 08:34:17  ✅ Applied (user_consents)
20250413093000 | 20250413093000 | 2025-04-13 09:30:00  ❌ PHANTOM (orgs missing!)
20251001211923 | 20251001211923 | 2025-10-01 21:19:23  ❌ PHANTOM (prompts missing!)
20251002100000 |                | 2025-10-02 10:00:00  ⏸️ Pending
20251003000000 |                | 2025-10-03 00:00:00  ⏸️ Pending
```

### Root Cause: Phantom Migrations

The remote database's `supabase_migrations.schema_migrations` table shows migrations 20250413093000 and 20251001211923 as applied, but the actual schema changes were never committed.

**How This Happens:**
1. Migration starts execution → history table updated
2. Migration fails or times out → schema changes rolled back
3. History table update already committed → creates desync
4. OR: Database restored from backup with mismatched history table
5. OR: Manual history table manipulation

**Current Impact:**
- Supabase CLI thinks migrations are applied (checks history table)
- But tables don't exist, so dependent migrations fail
- Cannot use `db push` because CLI refuses to re-apply "already applied" migrations
- Cannot use `db reset` because we must preserve existing data

## Solution Strategy

We'll use a **history repair + re-application** approach that:
1. ✅ Preserves all existing data (collections, user_consents)
2. ✅ Re-applies missing migrations safely (idempotent SQL)
3. ✅ Restores migration history integrity
4. ✅ Enables future migrations to work normally

## Migration Dependency Tree

```
20250328135512: collections
    ↓
20250328201010: drop RLS on collections
    ↓
20250402082709: add RLS policies to collections
    ↓
20250411083417: user_consents
    ↓
20250413093000: organizations, organization_members ← PHANTOM!
    ↓
20251001211923: prompt_collections, segments, prompts ← PHANTOM!
    ↓
20251002100000: localize prompts (ALTER TABLE) ← PENDING
    ↓
20251003000000: organization_invites ← PENDING
```

## Execution Plan

### Phase 1: Backup & Safety (CRITICAL - DO NOT SKIP)

**Step 1.1: Create Supabase Backup**
```
1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to: Database → Backups
4. Click "Create backup"
5. Name: "pre-migration-sync-2025-10-03"
6. Wait for backup to complete (usually 1-2 minutes)
7. ✅ Confirm backup shows in list with "Completed" status
```

**Step 1.2: Export Migration History**
```bash
npx supabase db remote exec \
  "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;" \
  > .ai/prompt-manager/migration-history-backup.txt
```

**Expected Output:**
```
     version     |        statements         |          name
-----------------|---------------------------|------------------------
 20250328135512 | {<migration SQL>}         | collections
 20250328201010 | {<migration SQL>}         | drop-rls
 20250402082709 | {<migration SQL>}         | add_rls_to_collections
 20250411083417 | {<migration SQL>}         | create_user_consents
 20250413093000 | {<migration SQL>}         | prompt_manager_orgs
 20251001211923 | {<migration SQL>}         | prompt_manager_catalog
```

**Step 1.3: Verify Existing Data**
```bash
# Check collections table data
npx supabase db remote exec \
  "SELECT COUNT(*) as collection_count FROM collections;"

# Check user_consents table data
npx supabase db remote exec \
  "SELECT COUNT(*) as consent_count FROM user_consents;"

# RECORD THESE COUNTS - we'll verify them later
```

**📝 Record in execution log:**
- Backup name: ________________
- Backup completion time: ________________
- Collections count: ________________
- User consents count: ________________

---

### Phase 2: Repair Migration History

**Step 2.1: Remove Phantom Migration Entries**
```bash
npx supabase db remote exec \
  "DELETE FROM supabase_migrations.schema_migrations
   WHERE version IN ('20250413093000', '20251001211923');"
```

**Expected Output:**
```
DELETE 2
```

**Step 2.2: Verify History Repair**
```bash
npx supabase migration list
```

**Expected Output:**
```
Local          | Remote         | Time (UTC)
----------------|----------------|---------------------
20250328135512 | 20250328135512 | 2025-03-28 13:55:12
20250328201010 | 20250328201010 | 2025-03-28 20:10:10
20250402082709 | 20250402082709 | 2025-04-02 08:27:09
20250411083417 | 20250411083417 | 2025-04-11 08:34:17
20250413093000 |                | 2025-04-13 09:30:00  ← Now shows as unapplied!
20251001211923 |                | 2025-10-01 21:19:23  ← Now shows as unapplied!
20251002100000 |                | 2025-10-02 10:00:00
20251003000000 |                | 2025-10-03 00:00:00
```

✅ **Success Criteria:** Migrations 20250413093000 and 20251001211923 should have empty Remote column

---

### Phase 3: Re-apply Missing Migrations

**Step 3.1: Review Migrations to Apply**
```bash
npx supabase db push --include-all
```

**Expected Prompt:**
```
Do you want to push these migrations to the remote database?
 • 20250413093000_prompt_manager_orgs.sql
 • 20251001211923_prompt_manager_catalog.sql
 • 20251002100000_localize_prompts_table.sql
 • 20251003000000_organization_invites.sql

 [Y/n]
```

**⚠️ BEFORE TYPING 'Y':** Verify the list shows exactly these 4 migrations in this order!

**Step 3.2: Apply Migrations**
```
Type: y
Press: Enter
```

**Expected Progress:**
```
Applying migration 20250413093000_prompt_manager_orgs.sql...
✓ Migration applied successfully

Applying migration 20251001211923_prompt_manager_catalog.sql...
✓ Migration applied successfully

Applying migration 20251002100000_localize_prompts_table.sql...
✓ Migration applied successfully

Applying migration 20251003000000_organization_invites.sql...
✓ Migration applied successfully
```

**📝 Record any errors or warnings in execution log**

---

### Phase 4: Verification

**Step 4.1: Verify Migration History**
```bash
npx supabase migration list
```

**Expected Output:**
```
Local          | Remote         | Time (UTC)
----------------|----------------|---------------------
20250328135512 | 20250328135512 | 2025-03-28 13:55:12
20250328201010 | 20250328201010 | 2025-03-28 20:10:10
20250402082709 | 20250402082709 | 2025-04-02 08:27:09
20250411083417 | 20250411083417 | 2025-04-11 08:34:17
20250413093000 | 20250413093000 | 2025-04-13 09:30:00  ← Now synced!
20251001211923 | 20251001211923 | 2025-10-01 21:19:23  ← Now synced!
20251002100000 | 20251002100000 | 2025-10-02 10:00:00  ← Newly applied!
20251003000000 | 20251003000000 | 2025-10-03 00:00:00  ← Newly applied!
```

✅ **Success Criteria:** All migrations show in both Local AND Remote columns

**Step 4.2: Verify Schema - Organizations**
```bash
npx supabase db remote exec \
  "SELECT * FROM organizations;"
```

**Expected Output:**
```
                  id                  |  slug   |   name   |        created_at         |        updated_at
--------------------------------------|---------|----------|---------------------------|---------------------------
 <uuid>                               | 10xdevs | 10xDevs  | 2025-10-03 15:xx:xx+00    | 2025-10-03 15:xx:xx+00
```

✅ **Success Criteria:** 10xDevs organization exists

**Step 4.3: Verify Schema - Prompt Tables**
```bash
npx supabase db remote exec \
  "SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE 'prompt%'
   ORDER BY table_name;"
```

**Expected Output:**
```
       table_name
-------------------------
 prompt_collection_segments
 prompt_collections
 prompts
```

✅ **Success Criteria:** All 3 prompt tables exist

**Step 4.4: Verify Schema - Invite Tables**
```bash
npx supabase db remote exec \
  "SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE '%invite%'
   ORDER BY table_name;"
```

**Expected Output:**
```
            table_name
-----------------------------------
 organization_invite_redemptions
 organization_invites
```

✅ **Success Criteria:** Both invite tables exist

**Step 4.5: Verify Localization Columns**
```bash
npx supabase db remote exec \
  "SELECT column_name FROM information_schema.columns
   WHERE table_name = 'prompts' AND column_name LIKE '%title%'
   ORDER BY column_name;"
```

**Expected Output:**
```
 column_name
-------------
 title_en
 title_pl
```

✅ **Success Criteria:** Both title_en and title_pl columns exist

**Step 4.6: Verify Seed Data**
```bash
npx supabase db remote exec \
  "SELECT COUNT(*) as collection_count FROM prompt_collections;"

npx supabase db remote exec \
  "SELECT COUNT(*) as segment_count FROM prompt_collection_segments;"

npx supabase db remote exec \
  "SELECT COUNT(*) as prompt_count FROM prompts;"
```

**Expected Output:**
```
 collection_count
------------------
                2  (fundamentals, advanced)

 segment_count
---------------
             2  (getting-started, best-practices)

 prompt_count
--------------
            2  (Project Setup Guide, Code Review Checklist)
```

✅ **Success Criteria:** Seed data exists

**Step 4.7: Verify Existing Data Preserved**
```bash
npx supabase db remote exec \
  "SELECT COUNT(*) as collection_count FROM collections;"

npx supabase db remote exec \
  "SELECT COUNT(*) as consent_count FROM user_consents;"
```

✅ **Success Criteria:** Counts match the values recorded in Phase 1, Step 1.3

**Step 4.8: Test db pull Command**
```bash
npx supabase db pull
```

**Expected Output:**
```
Connecting to remote database...
Schema written to supabase/schema.sql
```

✅ **Success Criteria:** Command completes without errors

---

## Why This Approach Is Safe

### 1. Idempotent Migrations
All migrations use defensive SQL:

```sql
-- Organizations migration
CREATE TABLE IF NOT EXISTS organizations (...);
INSERT INTO organizations (...) ON CONFLICT (slug) DO NOTHING;

-- Prompts migration
CREATE TABLE IF NOT EXISTS prompts (...);
INSERT INTO prompts (...) ON CONFLICT DO NOTHING;

-- Invites migration
CREATE TABLE IF NOT EXISTS organization_invites (...);
```

**Result:** Running migrations multiple times produces the same result (safe to re-run)

### 2. No Data Loss
- `collections` table: ✅ Untouched (different schema namespace)
- `user_consents` table: ✅ Untouched (different schema namespace)
- New tables: ✅ Don't exist yet, safe to create
- Localization migration: ✅ Only runs if `prompts` table exists

### 3. Atomic Operations
- Each migration runs in a transaction
- If any statement fails, entire migration rolls back
- Migration history only updated on success

### 4. Backup Available
- Full database backup created before changes
- Can restore within minutes if needed
- No permanent damage possible

---

## Rollback Plan (If Anything Goes Wrong)

### Scenario 1: Migration Fails During Execution

**Symptoms:**
- Error message during `db push`
- Some tables created, others missing
- Migration history partially updated

**Resolution:**
```bash
# 1. Note the error message
# 2. Restore migration history from backup
cat .ai/prompt-manager/migration-history-backup.txt

# 3. Manually restore missing history entries
npx supabase db remote exec \
  "INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
   VALUES ('20250413093000', 'prompt_manager_orgs', ARRAY['...'])
   ON CONFLICT (version) DO NOTHING;"

# 4. Restore database from Supabase backup
# Navigate to: Database → Backups → Restore → Select backup

# 5. Contact support with error details
```

### Scenario 2: Wrong Tables Dropped

**Symptoms:**
- `collections` or `user_consents` data missing
- Application errors about missing data

**Resolution:**
```bash
# 1. Immediately restore from backup
# Navigate to: Database → Backups → Restore → Select "pre-migration-sync-2025-10-03"

# 2. Wait for restore to complete (usually 2-3 minutes)

# 3. Verify data restored
npx supabase db remote exec "SELECT COUNT(*) FROM collections;"

# 4. Document what went wrong and create issue
```

### Scenario 3: Migration History Corrupted

**Symptoms:**
- `migration list` shows unexpected results
- Cannot push or pull migrations

**Resolution:**
```bash
# 1. Restore history from backup file
cat .ai/prompt-manager/migration-history-backup.txt

# 2. Manually recreate history entries via SQL
# Use the backup file as reference

# 3. Verify with: npx supabase migration list
```

---

## Risk Assessment

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss from existing tables | Very Low | High | Backup created; migrations don't touch these tables |
| Migration fails mid-execution | Low | Medium | Transactions ensure atomicity; can retry |
| History table corruption | Very Low | Low | Backup of history table created |
| Network timeout during push | Low | Low | Migrations resume from last successful point |
| Wrong migration order | Very Low | Medium | CLI enforces sequential order |

**Overall Risk Level:** 🟡 **Medium-Low**

**Safe to proceed because:**
- ✅ No existing data at risk (new tables only)
- ✅ Full backup created
- ✅ Idempotent migrations (safe to re-run)
- ✅ Clear rollback plan
- ✅ Each migration isolated in transaction

---

## Success Criteria Checklist

Before marking sync as complete, verify ALL of these:

- [ ] All 8 migrations shown as applied in both Local and Remote columns
- [ ] `organizations` table exists with 10xDevs organization
- [ ] `organization_members` table exists (may be empty)
- [ ] `prompt_collections` table exists with 2 collections
- [ ] `prompt_collection_segments` table exists with 2 segments
- [ ] `prompts` table exists with 2 sample prompts
- [ ] `prompts` table has localization columns (title_en, title_pl, markdown_body_en, markdown_body_pl)
- [ ] `organization_invites` table exists (empty)
- [ ] `organization_invite_redemptions` table exists (empty)
- [ ] Original `collections` table unchanged (verify count matches Phase 1 backup)
- [ ] Original `user_consents` table unchanged (verify count matches Phase 1 backup)
- [ ] `npx supabase db pull` runs without errors
- [ ] `npx supabase migration list` shows no discrepancies

---

## Post-Sync Tasks

### Immediate (Same Session)
1. [ ] Generate TypeScript types: `npx supabase gen types typescript --local > src/db/database.types.ts`
2. [ ] Restart development server: `npm run dev`
3. [ ] Test basic app functionality (collections, auth)

### Testing (Within 1 hour)
4. [ ] Run unit tests: `npm run test`
5. [ ] Run integration tests: `npm run test tests/integration/invite-flow.test.ts`
6. [ ] Manual smoke test: Create user, browse collections
7. [ ] Test admin panel access: Navigate to `/prompts/admin`

### Invite System Testing (Within 2 hours)
8. [ ] Test invite creation: Create invite as admin
9. [ ] Test invite validation: Open invite URL in incognito
10. [ ] Test invite redemption: Sign up new user via invite
11. [ ] Test invite stats: View stats for redeemed invite
12. [ ] Follow full manual testing checklist: `.ai/prompt-manager/invite-manual-testing-checklist.md`

### Documentation (Within 1 day)
13. [ ] Update execution log with results
14. [ ] Document any issues encountered
15. [ ] Update org-invite-link-plan.md implementation status
16. [ ] Create deployment runbook for production sync

---

## Estimated Timeline

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 1: Backup & Safety | 3-5 minutes | Most time is waiting for backup |
| Phase 2: Repair History | 1 minute | Quick SQL delete |
| Phase 3: Re-apply Migrations | 3-5 minutes | 4 migrations to apply |
| Phase 4: Verification | 3-5 minutes | Multiple checks |
| **Total** | **10-16 minutes** | Plus testing time |

**Add 30-60 minutes for post-sync testing and validation**

---

## Troubleshooting Common Issues

### Issue: "Migration already applied" error
**Cause:** History table not properly repaired
**Fix:** Verify Step 2.1 succeeded with `DELETE 2` output

### Issue: "relation does not exist" error
**Cause:** Migrations applied out of order
**Fix:** Verify migration list shows correct sequence

### Issue: Timeout during migration push
**Cause:** Network or database performance issue
**Fix:** Retry `npx supabase db push --include-all`

### Issue: Seed data not appearing
**Cause:** 10xDevs organization not created first
**Fix:** Manually insert: `INSERT INTO organizations (slug, name) VALUES ('10xdevs', '10xDevs');`

### Issue: Cannot connect to remote database
**Cause:** Auth token expired
**Fix:** Run `npx supabase login` and re-authenticate

---

## Related Documents

- Implementation plan: `.ai/prompt-manager/org-invite-link-plan.md`
- Testing checklist: `.ai/prompt-manager/invite-manual-testing-checklist.md`
- Execution log: `.ai/prompt-manager/db-sync-execution-log.md` (create during sync)
- Migration backup: `.ai/prompt-manager/migration-history-backup.txt` (create during sync)

---

## Approval & Sign-off

**Prepared by:** Claude (AI Assistant)
**Date:** 2025-10-03
**Reviewed by:** _________________
**Approved by:** _________________
**Execution date:** _________________
**Execution result:** ☐ Success ☐ Partial ☐ Failed ☐ Rolled back

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
