# Collection Naming Refactoring Plan

## Problem
Two different collection types both called "Collection" causing code confusion:
- **Rule Collections** (user's saved library selections) - `collections` table
- **Prompt Collections** (organizational prompt catalogs) - `prompt_collections` table

## Renaming Strategy

### 1. Rule Collections → RuleCollection

#### File Renames (for better searchability)
- `src/types/collection.types.ts` → `src/types/ruleCollection.types.ts`
- `src/store/collectionsStore.ts` → `src/store/ruleCollectionsStore.ts`
- `src/pages/api/collections.ts` → `src/pages/api/rule-collections.ts`
- `src/pages/api/collections/[id].ts` → `src/pages/api/rule-collections/[id].ts`
- `src/components/rule-collections/CollectionsList.tsx` → `src/components/rule-collections/RuleCollectionsList.tsx`
- `src/components/rule-collections/CollectionListEntry.tsx` → `src/components/rule-collections/RuleCollectionListEntry.tsx`
- `src/components/rule-collections/CollectionsSidebar.tsx` → `src/components/rule-collections/RuleCollectionsSidebar.tsx`
- `src/components/rule-collections/SaveCollectionDialog.tsx` → `src/components/rule-collections/SaveRuleCollectionDialog.tsx`
- `src/components/rule-collections/SaveDefaultDialog.tsx` → `src/components/rule-collections/SaveDefaultRuleCollectionDialog.tsx`
- `src/components/rule-collections/UnsavedChangesDialog.tsx` → `src/components/rule-collections/UnsavedRuleCollectionChangesDialog.tsx`
- `e2e/tests/collections.spec.ts` → `e2e/tests/rule-collections.spec.ts`
- `e2e/page-objects/CollectionsSidebarPage.ts` → `e2e/page-objects/RuleCollectionsSidebarPage.ts`
- `e2e/page-objects/SaveCollectionDialog.ts` → `e2e/page-objects/SaveRuleCollectionDialog.ts`

#### Files That Import Renamed Files (need import path updates)
- `src/components/TwoPane.tsx` - Update imports
- `src/components/MobileNavigation.tsx` - Update imports if any
- `e2e/global.teardown.ts` - Update any references
- Any other files importing from the renamed paths

### 2. Prompt Collections (Already Correctly Named)
**No changes needed - already using `PromptCollection`:**
- `src/services/prompt-manager/types.ts` - ✓ Already `PromptCollection`
- `src/services/prompt-manager/collectionService.ts` - ✓ Already correct
- `src/pages/api/prompts/admin/collections.ts` - ✓ Already correct
- `tests/unit/services/prompt-manager/collectionService.test.ts` - ✓ Already correct

### 3. Database Schema (No Changes)
- `collections` table → Rule Collections
- `prompt_collections` table → Prompt Collections

## Detailed Changes

### Type Definitions
**File: `src/types/collection.types.ts` → `src/types/ruleCollection.types.ts`**
- Rename file
- Rename `interface Collection` → `interface RuleCollection`
- Rename `collectionMapper` → `ruleCollectionMapper`
- Update all imports in consuming files

### Store
**File: `src/store/collectionsStore.ts` → `src/store/ruleCollectionsStore.ts`**
- Rename file
- Rename `Collection` → `RuleCollection`
- Rename `CollectionsState` → `RuleCollectionsState`
- Rename `useCollectionsStore` → `useRuleCollectionsStore`
- Update import path for `RuleCollection` type
- Update all internal references

### API Routes
**File: `src/pages/api/collections.ts` → `src/pages/api/rule-collections.ts`**
- Rename file
- Import `RuleCollection` from `../../types/ruleCollection.types`
- Import `ruleCollectionMapper` instead of `collectionMapper`
- **Note**: API path changes from `/api/collections` to `/api/rule-collections`

**File: `src/pages/api/collections/[id].ts` → `src/pages/api/rule-collections/[id].ts`**
- Rename file and directory
- Import `RuleCollection` from `../../../types/ruleCollection.types`
- **Note**: API path changes from `/api/collections/:id` to `/api/rule-collections/:id`

### Components
**File: `src/components/rule-collections/CollectionsList.tsx` → `RuleCollectionsList.tsx`**
- Rename file
- Import `useRuleCollectionsStore` from `../../store/ruleCollectionsStore`
- Import `RuleCollection` type from `../../types/ruleCollection.types`
- Rename component to `RuleCollectionsList`
- Update fetch URLs to `/api/rule-collections`

**File: `src/components/rule-collections/CollectionListEntry.tsx` → `RuleCollectionListEntry.tsx`**
- Rename file
- Import `RuleCollection` from `../../types/ruleCollection.types`
- Import `useRuleCollectionsStore` from `../../store/ruleCollectionsStore`
- Rename component to `RuleCollectionListEntry`

**File: `src/components/rule-collections/CollectionsSidebar.tsx` → `RuleCollectionsSidebar.tsx`**
- Rename file
- Import `useRuleCollectionsStore` from `../../store/ruleCollectionsStore`
- Import `RuleCollectionsList` (updated import)
- Rename component to `RuleCollectionsSidebar`

**File: `src/components/rule-collections/SaveCollectionDialog.tsx` → `SaveRuleCollectionDialog.tsx`**
- Rename file
- Rename component to `SaveRuleCollectionDialog`
- Update all prop interfaces

**File: `src/components/rule-collections/SaveDefaultDialog.tsx` → `SaveDefaultRuleCollectionDialog.tsx`**
- Rename file
- Rename component to `SaveDefaultRuleCollectionDialog`

**File: `src/components/rule-collections/UnsavedChangesDialog.tsx` → `UnsavedRuleCollectionChangesDialog.tsx`**
- Rename file
- Rename component to `UnsavedRuleCollectionChangesDialog`

### Parent Components (Import Updates)
**File: `src/components/TwoPane.tsx`**
- Update import: `RuleCollectionsSidebar` from `./rule-collections/RuleCollectionsSidebar`
- Update component usage

**File: `src/components/MobileNavigation.tsx`**
- Check and update any collection-related imports

### Tests
**File: `e2e/tests/collections.spec.ts` → `e2e/tests/rule-collections.spec.ts`**
- Rename file
- Update import: `RuleCollectionsSidebarPage` from `../page-objects/RuleCollectionsSidebarPage`
- Update import: `SaveRuleCollectionDialog` from `../page-objects/SaveRuleCollectionDialog`

**File: `e2e/page-objects/CollectionsSidebarPage.ts` → `RuleCollectionsSidebarPage.ts`**
- Rename file
- Rename class to `RuleCollectionsSidebarPage`
- Update all test IDs and selectors

**File: `e2e/page-objects/SaveCollectionDialog.ts` → `SaveRuleCollectionDialog.ts`**
- Rename file
- Rename class to `SaveRuleCollectionDialog`

**File: `e2e/global.teardown.ts`**
- Check for any references to update (likely uses API paths)
- Update fetch URLs to `/api/rule-collections`

## Implementation Steps

### Phase 1: Type Definitions & Core Files
1. **Rename type file**: `src/types/collection.types.ts` → `src/types/ruleCollection.types.ts`
   - Rename `Collection` → `RuleCollection`
   - Rename `collectionMapper` → `ruleCollectionMapper`

2. **Rename store file**: `src/store/collectionsStore.ts` → `src/store/ruleCollectionsStore.ts`
   - Update import path for types
   - Rename `CollectionsState` → `RuleCollectionsState`
   - Rename `useCollectionsStore` → `useRuleCollectionsStore`

### Phase 2: API Routes (Breaking Change!)
3. **Rename API directory**: `src/pages/api/collections/` → `src/pages/api/rule-collections/`
   - Move `collections.ts` → `rule-collections.ts`
   - Move `collections/[id].ts` → `rule-collections/[id].ts`
   - Update imports in both files
   - **⚠️ WARNING**: This changes API endpoints - may affect any external consumers

### Phase 3: Component Files
4. **Rename component files** in `src/components/rule-collections/`:
   - `CollectionsList.tsx` → `RuleCollectionsList.tsx`
   - `CollectionListEntry.tsx` → `RuleCollectionListEntry.tsx`
   - `CollectionsSidebar.tsx` → `RuleCollectionsSidebar.tsx`
   - `SaveCollectionDialog.tsx` → `SaveRuleCollectionDialog.tsx`
   - `SaveDefaultDialog.tsx` → `SaveDefaultRuleCollectionDialog.tsx`
   - `UnsavedChangesDialog.tsx` → `UnsavedRuleCollectionChangesDialog.tsx`

5. **Update component internals**:
   - Update all imports to new paths
   - Rename component exports
   - Update fetch URLs from `/api/collections` to `/api/rule-collections`

### Phase 4: Parent Component Updates
6. **Update `src/components/TwoPane.tsx`**:
   - Import `RuleCollectionsSidebar`
   - Update component usage

7. **Update `src/components/MobileNavigation.tsx`** (if needed)

### Phase 5: Test Files
8. **Rename E2E test files**:
   - `e2e/tests/collections.spec.ts` → `e2e/tests/rule-collections.spec.ts`
   - `e2e/page-objects/CollectionsSidebarPage.ts` → `RuleCollectionsSidebarPage.ts`
   - `e2e/page-objects/SaveCollectionDialog.ts` → `SaveRuleCollectionDialog.ts`

9. **Update test internals**:
   - Rename classes/exports
   - Update imports
   - Update API URLs in `e2e/global.teardown.ts`

### Phase 6: Verification
10. **Run TypeScript check**: `npm run build` or `tsc --noEmit`
11. **Run tests**: `npm run test && npm run test:e2e`
12. **Search for remaining "Collection" references**: Use grep to find any missed files

## Verification Checklist
- [ ] All files renamed successfully
- [ ] All import paths updated
- [ ] All component names updated
- [ ] All API URLs updated to `/api/rule-collections`
- [ ] TypeScript compilation succeeds
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] No remaining ambiguous `Collection` type references
- [ ] Clear distinction between `RuleCollection` and `PromptCollection`
- [ ] Search codebase confirms no "collections" references outside prompt-manager

## Breaking Changes
⚠️ **API Route Changes**:
- `/api/collections` → `/api/rule-collections`
- `/api/collections/:id` → `/api/rule-collections/:id`

If there are any external consumers (mobile apps, integrations, etc.), they will need to update their API paths.
