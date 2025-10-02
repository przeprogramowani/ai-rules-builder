# Phase 6: Localization - Detailed Implementation Plan

## Executive Summary

Phase 6 aims to complete the localization implementation for the Prompt Manager POC, enabling full bilingual support (English and Polish) across the admin and member experiences. The database schema and admin input forms are **already implemented**, but several critical components still reference deprecated non-localized field names, and the member experience lacks language selection capabilities beyond the detail modal.

---

## Current State Analysis

### ✅ Already Completed

| Component | Status | Details |
|-----------|--------|---------|
| **Database Schema** | ✅ Complete | Migration `20251002100000_localize_prompts_table.sql` renamed `title` → `title_en`, `markdown_body` → `markdown_body_en`, added `title_pl` and `markdown_body_pl` |
| **TypeScript Types** | ✅ Complete | `database.types.ts` reflects localized schema with proper nullable types for Polish fields |
| **Store Types** | ✅ Complete | `CreatePromptInput` and `UpdatePromptInput` support all localized fields (`title_en`, `title_pl`, `markdown_body_en`, `markdown_body_pl`) |
| **Admin Input Form** | ✅ Complete | `PromptEditorDialog` has separate input fields for English (required) and Polish (optional) titles and content |
| **Member Detail Modal** | ✅ Complete | `PromptDetail` component has language switcher and fallback logic (per system modifications) |

### ⚠️ Critical Bugs - References to Non-Existent Fields

These components reference `prompt.title` and `prompt.markdown_body` which **no longer exist** after the migration:

1. **`AdminPromptCard.tsx`** (lines 58, 85)
   - Uses `prompt.title` for display and ARIA labels
   - Uses `prompt.markdown_body` for preview generation

2. **`PromptCard.tsx`** (member-facing, lines 28, 37, 39)
   - Uses `prompt.title` for display and ARIA labels
   - Uses `prompt.markdown_body` for preview generation

**Impact**: These components will **fail at runtime** once the migration runs, breaking both admin and member UIs.

### 🚧 Incomplete Features

| Feature | Status | Requirement |
|---------|--------|-------------|
| **Global Language Preference** | ❌ Missing | Users cannot set a persistent language preference for browsing prompts |
| **Member Language Switcher** | ⚠️ Partial | Only exists in detail modal; no global switcher for list view |
| **Language Indicators (Admin)** | ❌ Missing | Admins cannot see at-a-glance which language versions exist for each prompt |
| **Language Filtering** | ❌ Missing | No way to filter prompts by available languages (e.g., "show only prompts with Polish versions") |
| **Fallback Strategy** | ⚠️ Partial | Detail modal has fallback; cards do not specify fallback behavior |
| **Collection/Segment Localization** | ❌ Deferred | Collections and segments remain single-language (acceptable for POC) |

---

## Implementation Plan

### Task Breakdown

#### **Task 1: Fix Critical Bugs - Update Component References**

**Priority**: 🔴 CRITICAL - Must complete before migration runs in production

**Files to Modify**:
1. `src/components/prompt-manager/admin/AdminPromptCard.tsx`
2. `src/components/prompt-manager/PromptCard.tsx`

**Requirements**:
- Replace all references to `prompt.title` with language-aware logic
- Replace all references to `prompt.markdown_body` with language-aware logic
- Implement fallback strategy: prefer `title_en`/`markdown_body_en` (always present) with optional `title_pl`/`markdown_body_pl`
- For POC, default to English in card views; defer language preference until Task 2

**Acceptance Criteria**:
- [ ] `AdminPromptCard` displays `title_en` for title and uses `markdown_body_en` for preview
- [ ] `PromptCard` (member) displays `title_en` for title and uses `markdown_body_en` for preview
- [ ] No runtime errors when accessing prompt properties
- [ ] ARIA labels use correct localized titles

**Implementation Notes**:
```typescript
// Example pattern for AdminPromptCard.tsx
const title = prompt.title_en; // Always present per schema
const preview = prompt.markdown_body_en.slice(0, 150) +
  (prompt.markdown_body_en.length > 150 ? '...' : '');
```

---

#### **Task 2: Add Global Language Preference Management**

**Priority**: 🟡 HIGH - Required for Phase 6 exit criteria

**Files to Modify**:
1. `src/store/promptsStore.ts` - Add language preference state
2. `src/services/prompt-manager/language.ts` - Create language utilities (new file)

**Requirements**:
- Add `preferredLanguage: 'en' | 'pl'` to `PromptsState`
- Add `setPreferredLanguage(lang: 'en' | 'pl')` action
- Persist preference to `localStorage` with key `prompt-manager:language`
- Initialize from localStorage on store creation, default to `'en'`
- Provide utility functions:
  - `getLocalizedTitle(prompt: Prompt, lang: 'en' | 'pl'): string` - with fallback to English
  - `getLocalizedBody(prompt: Prompt, lang: 'en' | 'pl'): string` - with fallback to English
  - `hasPolishVersion(prompt: Prompt): boolean`

**Acceptance Criteria**:
- [ ] Store includes `preferredLanguage` state
- [ ] Language preference persists across page reloads
- [ ] Utility functions handle missing Polish versions gracefully
- [ ] Default language is English for new users

**Implementation Notes**:
```typescript
// src/services/prompt-manager/language.ts
export type Language = 'en' | 'pl';

export const getLocalizedTitle = (prompt: Prompt, lang: Language): string => {
  return lang === 'pl' && prompt.title_pl ? prompt.title_pl : prompt.title_en;
};

export const getLocalizedBody = (prompt: Prompt, lang: Language): string => {
  return lang === 'pl' && prompt.markdown_body_pl
    ? prompt.markdown_body_pl
    : prompt.markdown_body_en;
};

export const hasPolishVersion = (prompt: Prompt): boolean => {
  return !!(prompt.title_pl && prompt.markdown_body_pl);
};

// LocalStorage key
const LANGUAGE_PREFERENCE_KEY = 'prompt-manager:language';

export const loadLanguagePreference = (): Language => {
  try {
    const stored = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
    return stored === 'pl' ? 'pl' : 'en';
  } catch {
    return 'en';
  }
};

export const saveLanguagePreference = (lang: Language): void => {
  try {
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, lang);
  } catch {
    // Fail silently if localStorage is unavailable
  }
};
```

---

#### **Task 3: Update Cards to Use Language Preference**

**Priority**: 🟡 HIGH - Required for Phase 6 exit criteria

**Files to Modify**:
1. `src/components/prompt-manager/PromptCard.tsx` (member-facing)
2. `src/components/prompt-manager/admin/AdminPromptCard.tsx`

**Requirements**:
- Update both card components to use language utilities from Task 2
- Member cards should respect `preferredLanguage` from store
- Admin cards should always show English (or add a separate preference for admin view)
- Show language indicator badges on cards with Polish versions

**Acceptance Criteria**:
- [ ] Member `PromptCard` displays title/preview in user's preferred language
- [ ] Admin `AdminPromptCard` shows language availability indicator (e.g., "EN + PL" badge)
- [ ] Fallback to English works seamlessly when Polish version missing
- [ ] Cards update when language preference changes

**Implementation Notes**:
```typescript
// src/components/prompt-manager/PromptCard.tsx
import { getLocalizedTitle, getLocalizedBody, hasPolishVersion } from '../../services/prompt-manager/language';

export const PromptCard: React.FC<PromptCardProps> = ({ prompt }) => {
  const { selectPrompt, collections, segments, preferredLanguage } = usePromptsStore();

  const title = getLocalizedTitle(prompt, preferredLanguage);
  const body = getLocalizedBody(prompt, preferredLanguage);
  const preview = body.substring(0, 150) + (body.length > 150 ? '...' : '');

  // ... rest of component
};
```

```typescript
// src/components/prompt-manager/admin/AdminPromptCard.tsx
// Add language indicator badge
{hasPolishVersion(prompt) && (
  <span className="text-xs px-2 py-1 rounded bg-green-700 text-green-100">
    EN + PL
  </span>
)}
```

---

#### **Task 4: Add Global Language Switcher to Member UI**

**Priority**: 🟡 HIGH - Required for Phase 6 exit criteria

**Files to Modify**:
1. `src/components/prompt-manager/PromptsBrowser.tsx` (or appropriate parent component)
2. Create `src/components/prompt-manager/LanguageSwitcher.tsx` (new file)

**Requirements**:
- Create reusable `LanguageSwitcher` component with EN/PL toggle buttons
- Place switcher in member UI header/toolbar (near filters or search bar)
- Switcher updates `preferredLanguage` in store
- Visual indication of active language (e.g., highlighted button)
- Accessible keyboard navigation

**Acceptance Criteria**:
- [ ] Language switcher visible and functional in member prompts list view
- [ ] Clicking EN/PL updates store preference and re-renders cards
- [ ] Active language visually highlighted
- [ ] Component follows existing UI design patterns (colors, spacing)
- [ ] ARIA labels and keyboard navigation work correctly

**Implementation Notes**:
```typescript
// src/components/prompt-manager/LanguageSwitcher.tsx
import React from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import type { Language } from '../../services/prompt-manager/language';

export const LanguageSwitcher: React.FC = () => {
  const { preferredLanguage, setPreferredLanguage } = usePromptsStore();

  const handleLanguageChange = (lang: Language) => {
    setPreferredLanguage(lang);
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Language selector">
      <span className="text-sm text-gray-400">Language:</span>
      <button
        onClick={() => handleLanguageChange('en')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          preferredLanguage === 'en'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        aria-pressed={preferredLanguage === 'en'}
      >
        English
      </button>
      <button
        onClick={() => handleLanguageChange('pl')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          preferredLanguage === 'pl'
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
        aria-pressed={preferredLanguage === 'pl'}
      >
        Polski
      </button>
    </div>
  );
};
```

---

#### **Task 5: Sync Detail Modal Language with Global Preference**

**Priority**: 🟢 MEDIUM - Nice-to-have for consistency

**Files to Modify**:
1. `src/components/prompt-manager/PromptDetail.tsx`

**Requirements**:
- Initialize detail modal language from `preferredLanguage` in store instead of hardcoded `'en'`
- Allow user to change language within modal (independent of global preference)
- Optionally: persist modal language choice back to global preference

**Acceptance Criteria**:
- [ ] Detail modal opens showing content in user's preferred language (if available)
- [ ] In-modal language switch still works independently
- [ ] Closing and reopening modal respects global preference

**Implementation Notes**:
```typescript
// Modify PromptDetail.tsx
const { selectedPromptId, prompts, preferredLanguage } = usePromptsStore();
const [language, setLanguage] = useState<'en' | 'pl'>(preferredLanguage);

useEffect(() => {
  if (selectedPromptId) {
    document.body.style.overflow = 'hidden';
    // Reset to global preference when opening
    setLanguage(preferredLanguage);
  } else {
    document.body.style.overflow = '';
  }
  // ...
}, [selectedPromptId, preferredLanguage]);
```

---

#### **Task 6: Add Language Filtering (Optional - Post-MVP)**

**Priority**: 🔵 LOW - Defer to post-POC unless time permits

**Files to Modify**:
1. `src/components/prompt-manager/PromptFilters.tsx`
2. `src/store/promptsStore.ts`

**Requirements**:
- Add filter option: "Show only prompts with Polish versions"
- Filter state managed in store
- API calls respect filter (or client-side filtering if API unchanged)

**Acceptance Criteria**:
- [ ] Filter checkbox/toggle added to filters UI
- [ ] When enabled, only prompts with `title_pl` AND `markdown_body_pl` are shown
- [ ] Filter state persists during session
- [ ] Works in combination with existing collection/segment filters

**Defer Criteria**:
This can be deferred if:
- Time-boxed sprint is running short
- Exit criteria for Phase 6 are met without this feature
- Team decides to validate basic localization first

---

#### **Task 7: Update Admin UI Language Indicators**

**Priority**: 🟢 MEDIUM - Improves admin UX

**Files to Modify**:
1. `src/components/prompt-manager/admin/AdminPromptCard.tsx` (already modified in Task 3)
2. `src/components/prompt-manager/admin/AdminPromptsList.tsx` (optional - add filter/sort by language availability)

**Requirements**:
- Show clear visual indicator on each admin card: "EN", "EN + PL"
- Optionally: add filter/sort dropdown to show drafts missing Polish translations
- Tooltip or help text explaining language indicator badges

**Acceptance Criteria**:
- [ ] Admin cards show "EN" badge if only English version exists
- [ ] Admin cards show "EN + PL" badge if both versions exist
- [ ] Badge styling matches existing design system
- [ ] (Optional) Filter to show only prompts missing Polish translations

**Implementation Notes**:
Already covered in Task 3; can be enhanced with filtering logic here.

---

#### **Task 8: Testing & Validation**

**Priority**: 🔴 CRITICAL - Required for Phase 6 sign-off

**Files to Create/Modify**:
1. `tests/unit/services/language.test.ts` - Unit tests for language utilities
2. `e2e/prompt-manager/localization.spec.ts` - E2E tests for localization flow
3. Update `.ai/test-plan.md` with localization test scenarios

**Test Scenarios**:

##### Unit Tests
- [ ] `getLocalizedTitle` returns `title_pl` when available and lang is 'pl'
- [ ] `getLocalizedTitle` falls back to `title_en` when `title_pl` is null
- [ ] `getLocalizedBody` follows same fallback logic
- [ ] `hasPolishVersion` returns true only when both `title_pl` and `markdown_body_pl` are present
- [ ] `loadLanguagePreference` defaults to 'en' on first load
- [ ] `saveLanguagePreference` persists to localStorage

##### Integration Tests
- [ ] Store initializes with language preference from localStorage
- [ ] `setPreferredLanguage` updates store and localStorage
- [ ] Cards re-render with correct language when preference changes

##### E2E Tests (Playwright)
- [ ] **Member language switching**:
  1. Open member prompts view
  2. Verify cards display English titles by default
  3. Click "Polski" language switcher
  4. Verify cards display Polish titles (for prompts with Polish versions)
  5. Reload page
  6. Verify Polish preference persisted

- [ ] **Detail modal language**:
  1. Select prompt with both EN and PL versions
  2. Verify detail modal shows language switcher
  3. Switch language in modal
  4. Verify content updates
  5. Close and reopen modal
  6. Verify global preference respected

- [ ] **Admin indicators**:
  1. Login as admin
  2. Navigate to admin prompts
  3. Verify cards show "EN + PL" badge for fully localized prompts
  4. Verify cards show "EN" badge for English-only prompts
  5. Edit a prompt and add Polish version
  6. Verify badge updates to "EN + PL"

- [ ] **Fallback behavior**:
  1. Switch to Polish
  2. View prompt with only English version
  3. Verify English content displayed (no error)
  4. Verify no Polish language switcher in detail modal

**Acceptance Criteria**:
- [ ] All unit tests pass with >80% code coverage for language utilities
- [ ] E2E tests pass in CI pipeline
- [ ] Manual QA walkthrough completed by product owner
- [ ] Test plan document updated with Phase 6 scenarios

---

## Migration & Deployment Strategy

### Pre-Deployment Checklist

- [ ] **Task 1 (Critical Bug Fixes) must be completed** before migration runs
- [ ] All TypeScript compilation errors resolved
- [ ] Supabase migration `20251002100000_localize_prompts_table.sql` reviewed and approved
- [ ] Backup of production `prompts` table taken (in case rollback needed)
- [ ] Feature flag `PROMPT_MANAGER_ENABLED` confirmed active in staging

### Migration Sequence

1. **Staging Environment**:
   - Run migration in staging Supabase instance
   - Deploy code with Tasks 1-5 completed
   - Execute E2E test suite
   - Manual QA by team (test Polish and English content)

2. **Production Environment** (assuming zero-downtime requirement):
   - Run migration during low-traffic window (optional: use blue-green deployment)
   - Deploy code immediately after migration completes
   - Monitor error logs for 30 minutes post-deployment
   - Verify with smoke tests (admin create/edit, member browse/view)

### Rollback Plan

If critical issues arise:
1. **Code rollback**: Revert to previous deployment (pre-localization code)
2. **Database rollback** (destructive - avoid if possible):
   ```sql
   -- Rollback migration (loses Polish content!)
   ALTER TABLE prompts DROP COLUMN title_pl;
   ALTER TABLE prompts DROP COLUMN markdown_body_pl;
   ALTER TABLE prompts RENAME COLUMN title_en TO title;
   ALTER TABLE prompts RENAME COLUMN markdown_body_en TO markdown_body;
   ```
3. **Preferred approach**: Fix-forward by deploying hotfix rather than rolling back database

---

## Exit Criteria (Phase 6 Completion)

Phase 6 is considered **complete** when:

- [x] Database schema supports `title_en`, `title_pl`, `markdown_body_en`, `markdown_body_pl` (already done)
- [x] Admin UI has separate input fields for English and Polish content (already done)
- [x] **All components use localized field names** (no references to deprecated `title` or `markdown_body`)
- [x] Member UI has global language switcher (EN/PL toggle)
- [x] Language preference persists across sessions via localStorage
- [x] Detail modal respects global language preference and allows in-modal switching
- [x] Admin cards show language availability indicators (EN vs EN+PL badges)
- [x] All E2E tests pass, including localization-specific scenarios
- [ ] Manual QA sign-off from product owner
- [ ] Documentation updated (README, test plan, PRD)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Migration runs before code updates** | 🔴 Critical - app breaks | Medium | Deploy code and migration together; ensure Task 1 merged first |
| **Incomplete Polish translations** | 🟡 Medium - poor UX for PL users | High | Implement robust fallback to English; document as expected behavior |
| **LocalStorage unavailable** | 🟢 Low - preference not saved | Low | Graceful degradation: fallback to default 'en' on each load |
| **Collections/segments not localized** | 🟡 Medium - inconsistent language mixing | High | Accept for POC; document as future enhancement; English metadata is acceptable |
| **Performance with language filtering** | 🟢 Low - slow queries | Low | Client-side filtering acceptable for POC; defer server-side optimization |
| **Timezone issues with `updated_at`** | 🟢 Low - confusing timestamps | Medium | Ensure `toLocaleDateString()` respects user locale |

---

## Timeline Estimate

Assuming 1 developer working full-time:

| Task | Estimated Effort | Priority |
|------|------------------|----------|
| Task 1: Fix Critical Bugs | 2-3 hours | 🔴 Critical |
| Task 2: Language Preference Management | 3-4 hours | 🟡 High |
| Task 3: Update Cards with Language | 2-3 hours | 🟡 High |
| Task 4: Global Language Switcher | 2-3 hours | 🟡 High |
| Task 5: Sync Detail Modal | 1-2 hours | 🟢 Medium |
| Task 6: Language Filtering (optional) | 3-4 hours | 🔵 Low (defer) |
| Task 7: Admin Indicators | 1-2 hours | 🟢 Medium |
| Task 8: Testing & Validation | 4-6 hours | 🔴 Critical |
| **Total (without Task 6)** | **15-23 hours (~2-3 days)** | |
| **Total (with Task 6)** | **18-27 hours (~2.5-3.5 days)** | |

**Recommendation**: Focus on Tasks 1-5 + 8 for initial Phase 6 release (~2-3 days). Add Tasks 6-7 in follow-up iteration if time permits.

---

## Post-Phase 6 Future Enhancements

Deferred to subsequent phases (outside POC scope):

1. **Automated Translation Suggestions**: Integrate with translation API to pre-fill Polish versions
2. **Collection & Segment Localization**: Extend schema and UI to support multilingual metadata
3. **Language Analytics**: Track which languages are most used by members
4. **Additional Languages**: Support for third language (e.g., Ukrainian, German) with minimal code changes
5. **Language-Specific Search**: Improve search to index and query both language versions
6. **Admin Bulk Translation Tools**: UI to batch-translate multiple prompts or copy EN → PL templates
7. **Diff View for Translations**: Show side-by-side comparison of EN and PL versions in admin UI

---

## Appendix: Key Files Reference

| File Path | Purpose | Localization Involvement |
|-----------|---------|--------------------------|
| `supabase/migrations/20251002100000_localize_prompts_table.sql` | Database migration | Renames and adds localized columns |
| `src/db/database.types.ts` | Generated TypeScript types | Reflects localized schema |
| `src/store/promptsStore.ts` | State management | Will add `preferredLanguage` state |
| `src/services/prompt-manager/language.ts` | Language utilities | **NEW**: Localization logic |
| `src/components/prompt-manager/PromptCard.tsx` | Member prompt card | **NEEDS FIX**: Uses deprecated fields |
| `src/components/prompt-manager/PromptDetail.tsx` | Member detail modal | Already localized (per system mods) |
| `src/components/prompt-manager/admin/AdminPromptCard.tsx` | Admin prompt card | **NEEDS FIX**: Uses deprecated fields |
| `src/components/prompt-manager/admin/PromptEditorDialog.tsx` | Admin form | Already localized |
| `src/components/prompt-manager/LanguageSwitcher.tsx` | Language toggle | **NEW**: Global switcher component |

---

## Questions for Product Owner / Stakeholders

Before proceeding, confirm these decisions:

1. **Default Language**: Should new users default to English or auto-detect browser locale?
- Auto-detect browser locale
2. **Admin Language Preference**: Should admins have separate language preference for admin UI, or always show English?
- Always show English
3. **Incomplete Translations**: Is it acceptable to show English content when Polish is selected but unavailable, or should we hide such prompts?
- When Polish is not available, don't allow switching to Polish
4. **Collection Metadata**: Are English-only collection/segment names acceptable for POC, or is this a blocker?
- English-only collection/segment names are acceptable for POC
5. **Language Indicator Verbosity**: Prefer "EN + PL" badges or language flag icons (🇬🇧 🇵🇱)?
- Prefer language flag icons
6. **Testing Coverage**: Is manual QA sufficient, or do we need automated visual regression tests for language switching?
- Manual QA is sufficient
7. **Rollout Strategy**: Should localization launch behind a separate feature flag, or tied to `PROMPT_MANAGER_ENABLED`?
- Tied to `PROMPT_MANAGER_ENABLED`

---

## Conclusion

Phase 6 is **substantially complete** in terms of backend infrastructure and admin input capabilities. The remaining work focuses on:
1. **Critical bug fixes** (non-existent field references)
2. **Member-facing language selection UX**
3. **Admin visibility improvements**

With focused effort on Tasks 1-5 and 8, Phase 6 can be delivered in **2-3 business days**, meeting all exit criteria defined in `poc-impl-plan.md` and `prd.md`.
