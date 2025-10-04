# Database Sync Execution Log

**Date:** _________________
**Executed by:** _________________
**Start time:** _________________
**End time:** _________________
**Status:** ☐ In Progress ☐ Success ☐ Failed ☐ Rolled Back

---

## Pre-Execution Checklist

- [ ] Read full sync plan in `.ai/prompt-manager/db-sync.md`
- [ ] Understand rollback procedures
- [ ] Have Supabase dashboard access ready
- [ ] Have backup restore permissions confirmed
- [ ] Notify team members (if applicable)

---

## Phase 1: Backup & Safety

### Step 1.1: Create Supabase Backup
- [ ] Backup created
- **Backup name:** _________________________________________________
- **Backup status:** ☐ Completed ☐ Failed
- **Completion time:** _________________
- **Screenshot/confirmation:** ☐ Saved

### Step 1.2: Export Migration History
- [ ] Command executed: `npx supabase db remote exec "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;" > .ai/prompt-manager/migration-history-backup.txt`
- **File created:** x Yes ☐ No
- **Number of migrations in backup:** 6
- **Any errors:** _________________________________________________

### Step 1.3: Verify Existing Data
```bash
# Collections count
npx supabase db remote exec "SELECT COUNT(*) as collection_count FROM collections;"
```
- **Collections count:** 54

```bash
# User consents count
npx supabase db remote exec "SELECT COUNT(*) as consent_count FROM user_consents;"
```
- **User consents count:** 260

**⚠️ CRITICAL: Record these numbers! We'll verify them after sync.**

---

## Phase 2: Repair Migration History

### Step 2.1: Remove Phantom Migration Entries
```bash
npx supabase db remote exec \
  "DELETE FROM supabase_migrations.schema_migrations
   WHERE version IN ('20250413093000', '20251001211923');"
```

- [ ] Command executed
- **Output:** Success. No rows returned
- **Expected:** `DELETE 2`
- **Match:** x Yes ☐ No
- **Time:** _________________
- After deletion: 4 migrations remaining
collections
drop-rls
add_rls_to_collections
create_user_consents


**If output doesn't match:**
- **Issue description:** _________________________________________________
- **Resolution taken:** _________________________________________________

### Step 2.2: Verify History Repair
```bash
npx supabase migration list
```

- [ ] Command executed
- **Migrations showing as unapplied (empty Remote column):**
  - ☐ 20250413093000
  - ☐ 20251001211923
  - ☐ 20251002100000
  - ☐ 20251003000000
- **Time:** _________________

**Screenshot of migration list:**
☐ Saved to: _________________________________________________

---

## Phase 3: Re-apply Missing Migrations

### Step 3.1: Review Migrations to Apply
```bash
npx supabase db push --include-all
```

- [ ] Prompt appeared
- **Migrations listed:**
  - ☐ 20250413093000_prompt_manager_orgs.sql
  - ☐ 20251001211923_prompt_manager_catalog.sql
  - ☐ 20251002100000_localize_prompts_table.sql
  - ☐ 20251003000000_organization_invites.sql
- **Order correct:** ☐ Yes ☐ No
- **Time:** _________________

### Step 3.2: Apply Migrations

**User input:** Typed `y` and pressed Enter at: _________________

#### Migration 1: 20250413093000_prompt_manager_orgs.sql
- **Status:** ☐ Success ☐ Failed
- **Start time:** _________________
- **End time:** _________________
- **Duration:** _________________
- **Output:** _________________________________________________
- **Errors:** _________________________________________________

#### Migration 2: 20251001211923_prompt_manager_catalog.sql
- **Status:** ☐ Success ☐ Failed
- **Start time:** _________________
- **End time:** _________________
- **Duration:** _________________
- **Output:** _________________________________________________
- **Errors:** _________________________________________________

#### Migration 3: 20251002100000_localize_prompts_table.sql
- **Status:** ☐ Success ☐ Failed
- **Start time:** _________________
- **End time:** _________________
- **Duration:** _________________
- **Output:** _________________________________________________
- **Errors:** _________________________________________________

#### Migration 4: 20251003000000_organization_invites.sql
- **Status:** ☐ Success ☐ Failed
- **Start time:** _________________
- **End time:** _________________
- **Duration:** _________________
- **Output:** _________________________________________________
- **Errors:** _________________________________________________

**Overall migration push result:** ☐ All succeeded ☐ Some failed ☐ All failed

**If any migration failed:**
- **Action taken:** _________________________________________________
- **Rollback initiated:** ☐ Yes ☐ No
- **Rollback completed:** ☐ Yes ☐ No ☐ N/A

---

## Phase 4: Verification

### Step 4.1: Verify Migration History
```bash
npx supabase migration list
```

- [ ] Command executed
- **All migrations show in both Local AND Remote columns:** ☐ Yes ☐ No
- **Time:** _________________
- **Screenshot:** ☐ Saved

**Migration List Output:**
```
Local          | Remote         | Status
----------------|----------------|--------
20250328135512 | 20250328135512 | ☐ ✓
20250328201010 | 20250328201010 | ☐ ✓
20250402082709 | 20250402082709 | ☐ ✓
20250411083417 | 20250411083417 | ☐ ✓
20250413093000 | 20250413093000 | ☐ ✓
20251001211923 | 20251001211923 | ☐ ✓
20251002100000 | 20251002100000 | ☐ ✓
20251003000000 | 20251003000000 | ☐ ✓
```

### Step 4.2: Verify Schema - Organizations
```bash
npx supabase db remote exec "SELECT * FROM organizations;"
```

- [ ] Command executed
- **10xDevs organization exists:** ☐ Yes ☐ No
- **Organization ID:** _________________________________________________
- **Time:** _________________

**Output:**
```
id         | slug    | name    | created_at | updated_at
-----------|---------|---------|------------|------------


```

### Step 4.3: Verify Schema - Prompt Tables
```bash
npx supabase db remote exec \
  "SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE 'prompt%'
   ORDER BY table_name;"
```

- [ ] Command executed
- **Tables found:**
  - ☐ prompt_collection_segments
  - ☐ prompt_collections
  - ☐ prompts
- **All 3 tables exist:** ☐ Yes ☐ No
- **Time:** _________________

### Step 4.4: Verify Schema - Invite Tables
```bash
npx supabase db remote exec \
  "SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE '%invite%'
   ORDER BY table_name;"
```

- [ ] Command executed
- **Tables found:**
  - ☐ organization_invite_redemptions
  - ☐ organization_invites
- **Both tables exist:** ☐ Yes ☐ No
- **Time:** _________________

### Step 4.5: Verify Localization Columns
```bash
npx supabase db remote exec \
  "SELECT column_name FROM information_schema.columns
   WHERE table_name = 'prompts' AND column_name LIKE '%title%'
   ORDER BY column_name;"
```

- [ ] Command executed
- **Columns found:**
  - ☐ title_en
  - ☐ title_pl
- **Both columns exist:** ☐ Yes ☐ No
- **Time:** _________________

### Step 4.6: Verify Seed Data
```bash
# Collections
npx supabase db remote exec \
  "SELECT COUNT(*) as collection_count FROM prompt_collections;"
```
- **Collection count:** _________________ (expected: 2)

```bash
# Segments
npx supabase db remote exec \
  "SELECT COUNT(*) as segment_count FROM prompt_collection_segments;"
```
- **Segment count:** _________________ (expected: 2)

```bash
# Prompts
npx supabase db remote exec \
  "SELECT COUNT(*) as prompt_count FROM prompts;"
```
- **Prompt count:** _________________ (expected: 2)

**Seed data verification:** ☐ All counts match ☐ Some missing ☐ None found

### Step 4.7: Verify Existing Data Preserved
```bash
npx supabase db remote exec "SELECT COUNT(*) as collection_count FROM collections;"
```
- **Current count:** _________________
- **Original count (from Phase 1):** _________________
- **Match:** ☐ Yes ☐ No

```bash
npx supabase db remote exec "SELECT COUNT(*) as consent_count FROM user_consents;"
```
- **Current count:** _________________
- **Original count (from Phase 1):** _________________
- **Match:** ☐ Yes ☐ No

**⚠️ CRITICAL: If counts don't match, STOP and initiate rollback!**

### Step 4.8: Test db pull Command
```bash
npx supabase db pull
```

- [ ] Command executed
- **Status:** ☐ Success ☐ Failed
- **Output:** _________________________________________________
- **Time:** _________________

---

## Success Criteria Validation

Check ALL boxes to confirm sync success:

**Migration Status:**
- [ ] All 8 migrations show as applied in both Local and Remote
- [ ] No migration history discrepancies

**Schema Validation:**
- [ ] `organizations` table exists with 10xDevs org
- [ ] `organization_members` table exists
- [ ] `prompt_collections` table exists with 2 collections
- [ ] `prompt_collection_segments` table exists with 2 segments
- [ ] `prompts` table exists with 2 sample prompts
- [ ] `prompts` has localization columns (title_en, title_pl, etc.)
- [ ] `organization_invites` table exists
- [ ] `organization_invite_redemptions` table exists

**Data Preservation:**
- [ ] Original `collections` table data unchanged
- [ ] Original `user_consents` table data unchanged
- [ ] All record counts match Phase 1 backup

**Functionality:**
- [ ] `npx supabase db pull` runs without errors
- [ ] No errors in Supabase dashboard logs

---

## Post-Sync Tasks Completed

### Immediate Tasks
- [ ] TypeScript types regenerated: `npx supabase gen types typescript --local > src/db/database.types.ts`
- [ ] Development server restarted
- [ ] Basic app functionality tested (collections, auth)

### Testing Tasks
- [ ] Unit tests passed: `npm run test`
- [ ] Integration tests passed: `npm run test tests/integration/invite-flow.test.ts`
- [ ] Manual smoke test completed
- [ ] Admin panel accessible: `/prompts/admin`

### Invite System Testing
- [ ] Invite creation tested
- [ ] Invite validation tested
- [ ] Invite redemption tested
- [ ] Invite stats tested
- [ ] Full manual testing checklist followed

### Documentation Tasks
- [ ] Execution log completed (this file)
- [ ] Issues documented
- [ ] Implementation plan updated
- [ ] Deployment runbook created

---

## Issues Encountered

### Issue #1
- **Description:** _________________________________________________
- **Phase/Step:** _________________________________________________
- **Impact:** ☐ Critical ☐ Major ☐ Minor
- **Resolution:** _________________________________________________
- **Time spent:** _________________

### Issue #2
- **Description:** _________________________________________________
- **Phase/Step:** _________________________________________________
- **Impact:** ☐ Critical ☐ Major ☐ Minor
- **Resolution:** _________________________________________________
- **Time spent:** _________________

### Issue #3
- **Description:** _________________________________________________
- **Phase/Step:** _________________________________________________
- **Impact:** ☐ Critical ☐ Major ☐ Minor
- **Resolution:** _________________________________________________
- **Time spent:** _________________

**Additional issues:** (attach separate document if more than 3)

---

## Rollback Information

**Rollback required:** ☐ Yes ☐ No

**If yes:**
- **Reason:** _________________________________________________
- **Rollback method:** ☐ Backup restore ☐ Manual SQL ☐ Migration repair
- **Rollback initiated at:** _________________
- **Rollback completed at:** _________________
- **Rollback successful:** ☐ Yes ☐ No
- **Database state after rollback:** _________________________________________________
- **Data loss (if any):** _________________________________________________

---

## Performance Metrics

- **Total execution time:** _________________ (minutes)
- **Phase 1 duration:** _________________ (minutes)
- **Phase 2 duration:** _________________ (minutes)
- **Phase 3 duration:** _________________ (minutes)
- **Phase 4 duration:** _________________ (minutes)
- **Post-sync testing duration:** _________________ (minutes)

**Compared to estimate (10-16 minutes):**
- ☐ Faster than expected
- ☐ Within expected range
- ☐ Slower than expected

**If slower, primary delays:**
- ☐ Network latency
- ☐ Database performance
- ☐ Migration execution time
- ☐ Troubleshooting issues
- ☐ Other: _________________________________________________

---

## Lessons Learned

**What went well:**
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

**What could be improved:**
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

**Recommendations for future migrations:**
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

---

## Sign-off

**Executor name:** _________________________________________________
**Executor signature:** _________________________________________________
**Date completed:** _________________________________________________

**Reviewer name:** _________________________________________________
**Reviewer signature:** _________________________________________________
**Review date:** _________________________________________________

**Final status:** ☐ Approved ☐ Approved with notes ☐ Rejected

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Appendix

### A. Command Reference
All commands used during sync (for copy-paste):
```bash
# Phase 1.2
npx supabase db remote exec "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;" > .ai/prompt-manager/migration-history-backup.txt

# Phase 1.3
npx supabase db remote exec "SELECT COUNT(*) as collection_count FROM collections;"
npx supabase db remote exec "SELECT COUNT(*) as consent_count FROM user_consents;"

# Phase 2.1
npx supabase db remote exec "DELETE FROM supabase_migrations.schema_migrations WHERE version IN ('20250413093000', '20251001211923');"

# Phase 2.2
npx supabase migration list

# Phase 3
npx supabase db push --include-all

# Phase 4
npx supabase migration list
npx supabase db remote exec "SELECT * FROM organizations;"
npx supabase db remote exec "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'prompt%' ORDER BY table_name;"
npx supabase db remote exec "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%invite%' ORDER BY table_name;"
npx supabase db remote exec "SELECT column_name FROM information_schema.columns WHERE table_name = 'prompts' AND column_name LIKE '%title%' ORDER BY column_name;"
npx supabase db remote exec "SELECT COUNT(*) as collection_count FROM prompt_collections;"
npx supabase db remote exec "SELECT COUNT(*) as segment_count FROM prompt_collection_segments;"
npx supabase db remote exec "SELECT COUNT(*) as prompt_count FROM prompts;"
npx supabase db remote exec "SELECT COUNT(*) as collection_count FROM collections;"
npx supabase db remote exec "SELECT COUNT(*) as consent_count FROM user_consents;"
npx supabase db pull
```

### B. Files Created
- [ ] `.ai/prompt-manager/migration-history-backup.txt` - Migration history backup
- [ ] Screenshots of verification steps (optional)

### C. Related Documentation
- Sync plan: `.ai/prompt-manager/db-sync.md`
- Implementation plan: `.ai/prompt-manager/org-invite-link-plan.md`
- Testing checklist: `.ai/prompt-manager/invite-manual-testing-checklist.md`
