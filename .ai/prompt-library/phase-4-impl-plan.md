# Phase 4: Member Experience Slice & Member APIs - Implementation Plan

## Overview
Build member-facing prompt browser with organization switching, collection/segment filtering, search, markdown rendering, copy/download actions. Reuse existing patterns from Rules Builder while extracting reusable components.

## Part A: Component Extraction & Reusability

### A1. Extract Generic Components (from existing codebase)
Create shared UI primitives by extracting from existing components:

**Files to create:**
- `src/components/ui/SearchBar.tsx` - Extract from `SearchInput.tsx`, make generic
  - Props: `value`, `onChange`, `placeholder`, `matchCount?`, `totalCount?`
  - Reusable for both Rules Builder and Prompts search

- `src/components/ui/Dropdown.tsx` - Extract dropdown logic from `EnvironmentDropdown.tsx`
  - Generic dropdown with portal support, keyboard navigation
  - Props: `options`, `value`, `onChange`, `label`, `renderOption?`

- `src/components/ui/CopyDownloadActions.tsx` - Extract from `RulesPreviewCopyDownloadActions.tsx`
  - Generic copy/download buttons with tooltip
  - Props: `content`, `filename`, `onCopy?`, `onDownload?`, `showCopied`

- `src/components/ui/MarkdownRenderer.tsx` - Extract from `MarkdownContentRenderer.tsx`
  - Generic markdown display component
  - Props: `content`, `className?`, `actions?`

### A2. Create Prompt-Specific Store
**File:** `src/store/promptsStore.ts`

Pattern: Follow `ruleCollectionsStore.ts` structure

**State:**
```typescript
{
  // Organization context
  organizations: OrganizationMembership[],
  activeOrganization: OrganizationMembership | null,

  // Collections & Segments
  collections: PromptCollection[],
  segments: PromptSegment[],

  // Prompts (published only for members)
  prompts: Prompt[],

  // Filters
  selectedCollectionId: string | null,
  selectedSegmentId: string | null,
  searchQuery: string,

  // UI State
  selectedPromptId: string | null,
  isLoading: boolean,
  error: string | null,
}
```

**Actions:**
- `fetchOrganizations()` - Load user's orgs
- `setActiveOrganization(org)` - Switch org
- `fetchCollections(orgId)` - Load collections for org
- `fetchSegments(collectionId)` - Load segments for collection
- `fetchPrompts(filters)` - Load published prompts with filters
- `selectPrompt(promptId)` - Open detail view
- `setFilters(collection, segment, search)` - Update filters

## Part B: Member API Endpoints

### B1. Create Member API Routes
**Files to create:**

1. `src/pages/api/prompts/index.ts` (member version)
   - `GET /api/prompts` - List published prompts
   - Query params: `?organization_id=X&collection_id=Y&segment_id=Z&search=query`
   - Returns only `status='published'` prompts
   - Uses `locals.user` for auth check (member or admin role)

2. `src/pages/api/prompts/[id].ts` (member version)
   - `GET /api/prompts/:id` - Get single published prompt
   - Returns 404 if draft or wrong organization

3. `src/pages/api/prompts/collections.ts`
   - `GET /api/prompts/collections?organization_id=X` - List collections for org
   - Member-accessible (no admin check)

4. `src/pages/api/prompts/collections/[id]/segments.ts`
   - `GET /api/prompts/collections/:id/segments` - List segments for collection
   - Member-accessible


### B2. Extend Service Layer
**Files to modify:**

1. `src/services/prompt-manager/promptService.ts`
   - Add `listPublishedPrompts(orgId, filters)` - member-safe query
   - Add `getPublishedPrompt(orgId, promptId)` - single prompt fetch

2. `src/services/prompt-manager/promptCollectionService.ts`
   - Add `listCollections(orgId)` - public collections
   - Add `listSegments(collectionId)` - public segments


### B3. Middleware & Access Guards
**Pattern:** Reuse from `/api/rule-collections.ts`

All member APIs check:
1. `isFeatureEnabled('promptManager')` - Feature flag
2. `locals.user` - Authentication required
3. `locals.promptManager.activeOrganization` - Organization membership


## Part C: Member UI Components

### C1. Organization Selector Component
**File:** `src/components/prompt-manager/OrganizationSelector.tsx`

**Pattern:** Similar to `EnvironmentDropdown.tsx`

**Features:**
- Dropdown with user's organizations
- Shows current org name
- Persists selection in store (`setActiveOrganization`)
- Triggers data refresh on change

### C2. Collection & Segment Filters
**File:** `src/components/prompt-manager/PromptFilters.tsx`

**Pattern:** Similar to `LayerSelector.tsx` + `StackSelector.tsx`

**Features:**
- Collection dropdown (fetched from API)
- Segment dropdown (filtered by collection)
- "All" option for both
- Updates `promptsStore` filters
- Shows count of prompts per collection/segment

### C3. Prompts List View
**File:** `src/components/prompt-manager/PromptsList.tsx`

**Pattern:** Similar to `RuleCollectionsList.tsx`

**Features:**
- Grid/list of prompt cards
- Each card shows: title, collection/segment tags
- Click to open detail modal/view
- Empty state when no prompts match filters
- Loading skeleton

**File:** `src/components/prompt-manager/PromptCard.tsx`
- Individual card component
- Hover effects
- Accessibility (keyboard navigation)

### C4. Prompt Detail View
**File:** `src/components/prompt-manager/PromptDetail.tsx`

**Pattern:** Modal similar to admin edit view (to be created in Phase 5)

**Features:**
- Full markdown content (use `MarkdownRenderer` from Part A1)
- Title, collection/segment breadcrumb
- Copy & Download actions (use `CopyDownloadActions` from Part A1)
- Close button
- Modal overlay (use existing modal pattern)

### C5. Main Member Page Container
**File:** `src/components/prompt-manager/PromptsBrowser.tsx`

**Structure:**
```
┌─────────────────────────────────────┐
│ Organization Selector               │
├─────────────────────────────────────┤
│ Filters: Collection | Segment       │
│ Search: [          ]  [X]          │
├─────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │Card │ │Card │ │Card │ │Card │   │
│ └─────┘ └─────┘ └─────┘ └─────┘   │
│ ┌─────┐ ┌─────┐                   │
│ │Card │ │Card │  ...              │
│ └─────┘ └─────┘                   │
└─────────────────────────────────────┘
```

**Uses:**
- `OrganizationSelector`
- `PromptFilters`
- `SearchBar` (from Part A1)
- `PromptsList`
- `PromptDetail` (modal)

## Part D: Routing & Pages

### D1. Prompts Main Page (Member)
**File:** `src/pages/prompts/index.astro`

**Features:**
- Feature flag check: `isPromptManagerEnabled()`
- Auth check: `Astro.locals.user` required
- Organization check: `Astro.locals.promptManager?.organizations.length > 0`
- If checks fail: redirect to `/auth/login` or show "request access" message
- If checks pass: render `<PromptsBrowser client:load />`

**Layout:** Reuse `Layout.astro` with Topbar/Footer like `index.astro`

### D2. Access Guard Middleware
**File:** `src/middleware.ts` (extend existing)

**Add logic:**
```typescript
if (url.pathname.startsWith('/prompts')) {
  if (!isPromptManagerEnabled()) {
    return new Response(null, { status: 404 });
  }

  if (!locals.user) {
    return Astro.redirect('/auth/login?redirect=/prompts');
  }

  // Build promptManager context
  locals.promptManager = await buildPromptManagerContext({
    supabase: locals.supabase,
    userId: locals.user.id,
    requestedSlug: url.searchParams.get('org'),
  });

  if (!hasPromptManagerAccess(locals.promptManager.organizations)) {
    // Show "request access" page instead of 404
    return Astro.redirect('/prompts/request-access');
  }
}
```

### D3. Request Access Page
**File:** `src/pages/prompts/request-access.astro`

**Features:**
- Shows message: "You need organization membership to access prompts"
- Link back to home

## Part E: Testing & Validation

### E1. Unit Tests
**Files to create:**
- `tests/unit/store/promptsStore.test.ts` - Store logic tests
- `tests/unit/components/prompt-manager/PromptCard.test.tsx` - Component tests
- `tests/unit/components/prompt-manager/PromptFilters.test.tsx` - Filter logic

### E2. Integration Tests
**File:** `tests/integration/prompt-member-flow.test.ts`

**Scenarios:**
1. Authenticated member with org → sees prompts list
2. Member switches organization → prompts refresh
3. Member filters by collection → list updates
4. Member searches → results filter
5. Member clicks prompt → detail modal opens
6. Member copies prompt → clipboard contains markdown
7. Member downloads prompt → file downloads

### E3. E2E Tests (Playwright)
**File:** `e2e/prompt-manager-member.spec.ts`

**Test cases:**
- Full member flow (login → browse → filter → view → copy)
- Organization switching
- Accessibility checks (keyboard navigation)

## Part G: Documentation Updates

### G1. Update Docs
**Files to update:**
- `README.md` - Add member routes `/prompts`
- `.ai/prompt-manager/poc-impl-plan.md` - Mark Phase 4 complete
- `.ai/test-plan.md` - Document member flow tests

## Implementation Order

1. **Part A** - Extract reusable components (1-2 hours)
3. **Part A2** - Create `promptsStore` (1 hour)
4. **Part B** - Member APIs & services (2-3 hours)
5. **Part C** - UI components (3-4 hours)
6. **Part D** - Routes & middleware (1-2 hours)
7. **Part E** - Tests (2-3 hours)
8. **Part G** - Documentation (30 min)

**Total estimate:** 12-16 hours

## Success Criteria (Exit Criteria from PRD)

✅ Authenticated member with organization membership can:
- Switch organizations (default 10xDevs)
- Browse prompts filtered by collection/segment
- Search prompts
- View markdown content
- Copy to clipboard (Cursor-compatible formatting)
- Download prompts

✅ Unauthenticated users redirected to login
✅ Users without organization see "request access" page
✅ Feature flag disabled → 404 on `/prompts` routes
✅ Only published prompts visible (drafts hidden)
