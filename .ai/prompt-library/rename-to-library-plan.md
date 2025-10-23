# Refactor Plan: "prompt-manager" → "prompt-library"

## Overview
This plan covers a comprehensive rename from "prompt-manager" to "prompt-library" across the codebase, including directories, files, code references, API routes, and documentation. The database table names will remain unchanged as they are already in production.

---

## 1. Directory Renames

### Source Directories
- `src/services/prompt-manager/` → `src/services/prompt-library/`
- `src/components/prompt-manager/` → `src/components/prompt-library/`
- `src/pages/api/prompt-manager/` → `src/pages/api/prompt-library/`
- `src/features/prompt-manager/` → (empty, can be deleted)

### Test Directories
- `tests/unit/services/prompt-manager/` → `tests/unit/services/prompt-library/`

### Documentation Directories
- `docs/prompt-manager/` → `docs/prompt-library/`
- `.ai/prompt-manager/` → `.ai/prompt-library/`

### Build Artifacts
- `dist/_worker.js/pages/api/prompt-manager` (will regenerate automatically on build)

---

## 2. File Renames

### Test Files
- `tests/fixtures/promptManagerFixtures.ts` → `tests/fixtures/promptLibraryFixtures.ts`
- `tests/unit/middleware/promptManagerMiddleware.test.ts` → `tests/unit/middleware/promptLibraryMiddleware.test.ts`
- `tests/unit/services/promptManagerAccess.test.ts` → `tests/unit/services/promptLibraryAccess.test.ts`

---

## 3. Code Reference Updates

### 3.1 Import Path Updates
All imports from `@/services/prompt-manager/*` → `@/services/prompt-library/*`
All imports from `@/components/prompt-manager/*` → `@/components/prompt-library/*`

**Affected files (63 files total):**
- All API route files in `src/pages/api/prompts/**/*.ts`
- `src/middleware/index.ts`
- `src/env.d.ts`
- `src/store/promptsStore.ts`
- All component files in `src/components/prompt-manager/**/*.tsx`
- All test files

### 3.2 Variable & Function Name Updates

**Pattern: `promptManager` → `promptLibrary`**
- `locals.promptManager` → `locals.promptLibrary` (in env.d.ts and all API routes)
- `buildPromptManagerContext` → `buildPromptLibraryContext`
- `hasPromptManagerAccess` → `hasPromptLibraryAccess`
- `hasPromptManagerAdminAccess` → `hasPromptLibraryAdminAccess`
- `ensurePromptManagerEnabled` → `ensurePromptLibraryEnabled`
- `shouldAllowPromptManagerAccess` → `shouldAllowPromptLibraryAccess`
- `shouldAllowPromptManagerAdminAccess` → `shouldAllowPromptLibraryAdminAccess`

**Pattern: `PromptManager` → `PromptLibrary`** (Type names)
- `PromptManagerContext` → `PromptLibraryContext`
- `PromptManagerContextOptions` → `PromptLibraryContextOptions`

### 3.3 Constant Name Updates

**Pattern: `PROMPT_MANAGER_*` → `PROMPT_LIBRARY_*`**
- `PROMPT_MANAGER_ENABLED` → `PROMPT_LIBRARY_ENABLED`
- `PROMPT_MANAGER_BASE_PATH` → `PROMPT_LIBRARY_BASE_PATH`
- `PROMPT_MANAGER_ADMIN_PATH` → `PROMPT_LIBRARY_ADMIN_PATH`
- `PROMPT_MANAGER_REQUEST_ACCESS_PATH` → `PROMPT_LIBRARY_REQUEST_ACCESS_PATH`
- `PROMPT_MANAGER_API_PATH` → `PROMPT_LIBRARY_API_PATH`
- `PROMPT_MANAGER_OVERRIDE_KEYS` → `PROMPT_LIBRARY_OVERRIDE_KEYS`
- `TEXT_PROMPT_MANAGER_DISABLED` → `TEXT_PROMPT_LIBRARY_DISABLED`

### 3.4 Function Name Updates (middleware)
- `isPromptManagerRoute` → `isPromptLibraryRoute`
- `isPromptManagerAdminRoute` → `isPromptLibraryAdminRoute`
- `promptManagerFlagDisabledResponse` → `promptLibraryFlagDisabledResponse`
- `isPromptManagerEnabled` → `isPromptLibraryEnabled`
- `readPromptManagerOverride` → `readPromptLibraryOverride`

---

## 4. Feature Flag Updates

### 4.1 Feature Flag Name
In `src/features/featureFlags.ts`:
- Type: `'promptManager'` → `'promptLibrary'`
- Constant export: `PROMPT_MANAGER_ENABLED` → `PROMPT_LIBRARY_ENABLED`
- Array: `PROMPT_MANAGER_ENABLED` → `PROMPT_LIBRARY_ENABLED` in FEATURE_KEYS

### 4.2 Environment Variables
- `PUBLIC_PROMPT_MANAGER_ENABLED` → `PUBLIC_PROMPT_LIBRARY_ENABLED`
- `PROMPT_MANAGER_ENABLED` → `PROMPT_LIBRARY_ENABLED`

Update in:
- `.env.local` (if exists)
- `.env.example` (if exists)
- CI/CD configuration files
- Deployment configuration

---

## 5. API Route Updates

### 5.1 Route Path Changes
- `/api/prompt-manager/organizations` → `/api/prompt-library/organizations`

**Affected file:**
- `src/pages/api/prompt-manager/organizations.ts` (move to `src/pages/api/prompt-library/organizations.ts`)

### 5.2 Client-side API Calls
Update fetch URLs in:
- `src/store/promptsStore.ts`: Line 149 `/api/prompt-manager/organizations` → `/api/prompt-library/organizations`
- `src/store/promptsStore.ts`: Line 184 `/api/prompt-manager/organizations` → `/api/prompt-library/organizations`

### 5.3 Important: URL Paths That DON'T Change
These paths use `/prompts` (not `/prompt-manager`) and should **NOT** be changed:
- `/prompts/*` (all user-facing routes)
- `/prompts/admin/*` (admin routes)
- `/api/prompts/*` (all prompt API routes)

---

## 6. Type Definition Updates

### 6.1 In env.d.ts
```typescript
// Line 22-26
promptLibrary?: {
  organizations: OrganizationMembership[];
  activeOrganization: OrganizationMembership | null;
  flagEnabled: boolean;
};
```

Import update:
```typescript
import type { OrganizationMembership } from './services/prompt-library/access';
```

---

## 7. Comment & Documentation Updates

### 7.1 Code Comments
Update all comments containing "Prompt Manager" → "Prompt Library":
- In migration files (comments only, NOT table names)
- In service files
- In middleware
- In test files

### 7.2 Documentation Files
Update content in:
- `docs/prompt-manager/admin-api.md` (move to `docs/prompt-library/`)
- All files in `.ai/prompt-manager/` (move to `.ai/prompt-library/`)
- Update PRD references to "Prompt Library POC"

### 7.3 Error Messages & User-Facing Text
- `TEXT_PROMPT_MANAGER_DISABLED = 'Prompt Manager is not available.'` → `'Prompt Library is not available.'`
- Any UI text referencing "Prompt Manager"

---

## 8. Database Considerations

### ⚠️ CRITICAL: DO NOT CHANGE
- Table names: `organizations`, `prompt_collections`, `prompt_collection_segments`, `prompts`
- These are already in production and should remain unchanged

### CAN UPDATE
- Comments in migration files referencing "Prompt Manager"
- New migration files can use "Prompt Library" naming convention

---

## 9. Test Updates

### 9.1 Test File Content
Update all test descriptions, assertions, and comments:
- Change "Prompt Manager" → "Prompt Library" in test names
- Update feature flag checks
- Update middleware test cases

### 9.2 Integration Tests
- `tests/integration/prompt-admin-flow.test.ts`
- `tests/integration/prompt-language.test.ts`
- `tests/integration/invite-flow.test.ts`

---

## 10. Build & Configuration

### Files to Check/Update
- `package.json` - Check for any scripts mentioning prompt-manager
- `astro.config.mjs` - Check for any references
- `tsconfig.json` - Check path aliases
- CI/CD workflows - Update environment variable names

---

## 11. Execution Order

### Phase 1: Preparation
1. Create backup branch
2. Run full test suite to establish baseline
3. Document current environment variable values

### Phase 2: Directory & File Renames
1. Rename directories (services, components, pages/api, tests, docs, .ai)
2. Rename individual files (fixtures, test files)

### Phase 3: Code Updates
1. Update all import paths
2. Update variable, function, and type names
3. Update constants and feature flags
4. Update API client calls

### Phase 4: Documentation & Comments
1. Update code comments
2. Update documentation files
3. Update error messages

### Phase 5: Configuration
1. Update environment variables
2. Update build configurations

### Phase 6: Testing & Verification
1. Run linter: `npm run lint`
2. Run tests: `npm test`
3. Build project: `npm run build`
4. Manual testing of all prompt-library features
5. Verify API routes work correctly

---

## 12. Files Requiring Updates (Summary)

**Total estimated files: ~80-100 files**

Key file groups:
- 10 service files in `src/services/prompt-manager/`
- 10 component files in `src/components/prompt-manager/`
- ~30 API route files using imports
- ~15 test files
- ~25 documentation/planning files
- 3-5 configuration files
- 1 middleware file
- 1 store file
- 1 env.d.ts file
- 1 feature flags file

---

## 13. Risk Assessment

### Low Risk
- Directory and file renames (automated tools available)
- Import path updates (IDE can handle)
- Variable name updates within functions

### Medium Risk
- Feature flag changes (requires environment updates)
- API route path changes (requires client update sync)

### High Risk
- Database references (already mitigated - NOT changing table names)
- Breaking changes in production (mitigated by feature flag)

---

## 14. Rollback Plan

If issues arise:
1. Revert to backup branch
2. Keep feature flag disabled during fix
3. Database tables unchanged, so no data risk
4. Environment variables can be quickly reverted

---

## 15. Search & Replace Patterns

### Exact Matches (Case Sensitive)
```
prompt-manager → prompt-library
promptManager → promptLibrary
PromptManager → PromptLibrary
PROMPT_MANAGER → PROMPT_LIBRARY
Prompt Manager → Prompt Library
```

### Files to Exclude from Search/Replace
- `node_modules/`
- `dist/`
- `.git/`
- `package-lock.json`
- Database migration SQL files (for table names)

---

## 16. Post-Refactor Checklist

- [ ] All tests passing
- [ ] Linter clean
- [ ] Build successful
- [ ] No broken imports
- [ ] API routes responding correctly
- [ ] Feature flag working
- [ ] Environment variables updated
- [ ] Documentation updated
- [ ] Git history clean (meaningful commit messages)
- [ ] PR created with detailed description
