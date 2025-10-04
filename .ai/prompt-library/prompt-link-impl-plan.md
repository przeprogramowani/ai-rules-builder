# Direct Linking to PromptDetail via URL Query Parameters - Implementation Plan

## 🎯 Overview
Enable deep linking to specific prompts using organization, collection, and segment slugs or IDs via URL query parameters. This allows sharing links like:
- `/prompts?org=acme&collection=onboarding&segment=welcome&prompt=intro-message`
- `/prompts?org=uuid&collection=uuid&segment=uuid&prompt=uuid`

## 🧠 Ultrathink Analysis

### URL Design Considerations

**Option A: Query Parameters (Recommended)**
```
/prompts?org=acme&collection=onboarding&segment=welcome&prompt=abc123
```
✅ Pros: Clean separation from Astro routing, easy to make optional, backward compatible, works with existing page
✅ Best for: Links with optional hierarchy (can link to just org, or org+collection, etc.)
❌ Cons: Less SEO-friendly, doesn't look as "pretty"

**Option B: Path Parameters**
```
/prompts/acme/onboarding/welcome/abc123
```
✅ Pros: SEO-friendly, clean URLs, clear hierarchy
❌ Cons: Requires Astro dynamic routes ([org]/[collection]/[segment]/[prompt].astro), more complex routing, requires all params

**Decision: Option A (Query Parameters)**
- Maintains existing `/prompts` page structure
- Supports partial deep links (e.g., just org+collection)
- Easier to implement incrementally
- Better UX for internal sharing

### Slug vs ID Support Strategy

**Database Schema Analysis:**
- `organizations`: has `slug` (unique, indexed)
- `prompt_collections`: has `slug` (unique per organization)
- `prompt_collection_segments`: has `slug` (unique per collection)
- `prompts`: has `id` only (UUID)

**Lookup Strategy:**
1. Accept both slug and ID for org/collection/segment (fallback to ID if slug fails)
2. Use ID only for prompts (no slug field exists)
3. Normalize slugs (lowercase, trim) before lookup

### State Hydration Flow

```mermaid
1. Page loads → Parse URL params
2. If params exist → Pause normal store initialization
3. Fetch organization by slug/ID
4. Set as activeOrganization
5. Fetch collections → Find collection by slug/ID
6. Set selectedCollectionId filter
7. Fetch segments → Find segment by slug/ID
8. Set selectedSegmentId filter
9. Fetch prompts with filters
10. Find prompt by ID → selectPrompt(id)
11. PromptDetail modal opens automatically
```

### Error Handling Philosophy

**Graceful Degradation:**
- Invalid org slug → Show organization selector (don't auto-select)
- Invalid collection slug → Show all collections
- Invalid segment slug → Show all segments
- Invalid prompt ID → Don't open modal, maybe show toast
- User feedback via toast notifications for each failure point

### URL Sync Strategy

**One-way vs Two-way:**
- **One-way (Recommended)**: URL → State only on initial load
  - Simpler implementation
  - No history pollution
  - User can navigate freely without URL updates

- **Two-way**: State ↔ URL bidirectional sync
  - Better for browser back/forward
  - More complex (need debouncing, history management)
  - Could implement later as enhancement

**Decision**: One-way for now

## 📋 Implementation Plan

### Part 1: URL Utilities

**File: `src/utils/urlParams.ts`**
```typescript
export interface PromptLinkParams {
  org?: string;        // slug or ID
  collection?: string; // slug or ID
  segment?: string;    // slug or ID
  prompt?: string;     // ID only
}

export function parsePromptParams(url: URL): PromptLinkParams
export function buildPromptUrl(params: PromptLinkParams): string
export function isUUID(value: string): boolean
```

### Part 2: Lookup Services

**File: `src/services/prompt-manager/lookupService.ts`**

Add functions:
- `findCollectionBySlugOrId(orgId: string, slugOrId: string): Promise<PromptCollection | null>`
- `findSegmentBySlugOrId(collectionId: string, slugOrId: string): Promise<PromptSegment | null>`

Reuse existing:
- `fetchOrganizationBySlug()` from organizations.ts

### Part 3: Store Enhancement

**File: `src/store/promptsStore.ts`**

Add new action:
```typescript
hydrateFromUrl: (params: PromptLinkParams) => Promise<{
  success: boolean;
  errors: string[];
}>;
```

Implementation:
1. Try to resolve organization (by slug or ID)
2. If found, fetch collections
3. Try to resolve collection (by slug or ID)
4. If found, fetch segments
5. Try to resolve segment (by slug or ID)
6. Fetch prompts with filters
7. Try to find prompt by ID
8. If found, call selectPrompt(id)
9. Return success status + array of errors

### Part 4: PromptsBrowser Enhancement

**File: `src/components/prompt-manager/PromptsBrowser.tsx`**

Modify `useEffect` initialization:
```typescript
useEffect(() => {
  const params = parsePromptParams(new URL(window.location.href));

  if (hasValidParams(params)) {
    // Deep link mode
    hydrateFromUrl(params).then(result => {
      if (result.errors.length > 0) {
        // Show toast for each error
        result.errors.forEach(showToast);
      }
    });
  } else {
    // Normal mode
    setPreferredLanguage(loadLanguagePreference());
    fetchOrganizations();
  }
}, []);
```

### Part 5: API Enhancements (if needed)

**File: `src/pages/api/prompts/collections.ts`**
- Already supports org filtering ✓

**File: `src/pages/api/prompts/collections/[id]/segments.ts`**
- Already supports collection filtering ✓

**New File: `src/pages/api/prompts/collections/by-slug.ts`**
```typescript
GET /api/prompts/collections/by-slug?org_id=xxx&slug=yyy
// Returns collection or 404
```

**New File: `src/pages/api/prompts/segments/by-slug.ts`**
```typescript
GET /api/prompts/segments/by-slug?collection_id=xxx&slug=yyy
// Returns segment or 404
```

### Part 6: PromptDetail Enhancement

**File: `src/components/prompt-manager/PromptDetail.tsx`**

Add "Share" button that copies current URL with params:
```typescript
const handleShare = () => {
  const url = buildPromptUrl({
    org: activeOrganization.slug,
    collection: collection?.slug,
    segment: segment?.slug,
    prompt: selectedPrompt.id
  });
  navigator.clipboard.writeText(url);
  toast.success('Link copied!');
};
```

## 🧪 Testing Strategy

### Unit Tests
- `parsePromptParams()` with various URL formats
- `buildPromptUrl()` URL generation
- `isUUID()` validation
- Lookup services with mock data

### Integration Tests (Playwright)
1. Direct link with all valid params → modal opens automatically
2. Direct link with invalid org slug → shows org selector
3. Direct link with invalid collection slug → shows collections list
4. Direct link with invalid prompt ID → shows toast error
5. Direct link with partial params (org only) → filters applied
6. Share button copies correct URL

### Edge Cases
- URL params with special characters (URL encoding)
- Multiple tabs with different links (isolation)
- Back/forward browser navigation
- Expired/deleted prompts
- User without org access (redirects to access request)

## 📦 Deliverables

1. ✅ `src/utils/urlParams.ts` - URL parsing and building utilities
2. ✅ `src/services/prompt-manager/lookupService.ts` - Slug/ID lookup functions
3. ✅ `src/store/promptsStore.ts` - Add `hydrateFromUrl()` action
4. ✅ `src/components/prompt-manager/PromptsBrowser.tsx` - URL initialization logic
5. ✅ `src/pages/api/prompts/collections/by-slug.ts` - Collection lookup endpoint
6. ✅ `src/pages/api/prompts/segments/by-slug.ts` - Segment lookup endpoint
7. ✅ `src/components/prompt-manager/PromptDetail.tsx` - Share button
9. ✅ Update `.ai/prompt-manager/prompt-link-impl-plan.md` (this file)

## 🚀 Implementation Phases

**Phase 1: Core Infrastructure (2-3 hours)**
- URL utilities (parsing, building, validation)
- Lookup service functions
- Unit tests

**Phase 2: Store Integration (1-2 hours)**
- `hydrateFromUrl()` action
- Error handling
- Loading states

**Phase 3: UI Integration (2-3 hours)**
- PromptsBrowser URL initialization
- Toast notifications for errors
- Loading indicators

**Phase 4: API Endpoints (1-2 hours)**
- Slug lookup endpoints
- Error responses
- Integration tests

**Phase 5: Enhancements & Testing (2-3 hours)**
- Share button in PromptDetail
- E2E test suite
- Documentation

**Total Estimate: 8-13 hours**

## 🔒 Security Considerations

1. **Authorization**: Verify user has access to organization before resolving slugs
2. **Input validation**: Sanitize all URL params before DB queries
3. **Rate limiting**: Consider rate limits on lookup endpoints (DoS prevention)
4. **XSS prevention**: URL params displayed in UI must be escaped
5. **SSRF prevention**: Validate UUIDs match expected format

## 📚 Documentation Updates

- Update user documentation with deep linking examples
- Add API documentation for new lookup endpoints
- Include URL structure in sharing feature guide

## 🎁 Future Enhancements

1. **Two-way URL sync**: Update URL as user navigates (useEffect + history.replaceState)
2. **SEO optimization**: Add Open Graph meta tags based on URL params
3. **Analytics**: Track deep link usage (which orgs/collections most shared)
4. **QR codes**: Generate QR codes for prompt links
5. **Short URLs**: Service to create shortened prompt links (e.g., `/p/abc123`)
6. **Path-based routing**: Migrate to `/prompts/:org/:collection/:segment/:id` for better SEO

---

**Ready to implement? This plan provides a solid foundation for deep linking while maintaining backward compatibility and user experience.**
