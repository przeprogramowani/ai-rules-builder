# Phase 5: Admin Experience Slice - Implementation Plan

## Overview
Build admin curation UI at `/prompts/admin` with organization selector, draft list view, editor form, and publish toggle - reusing existing patterns from member UI and rule collections.

## Part 1: Reusable UI Components (Extract & Create)

### 1.1 Extract `FormInput` component
**File:** `src/components/ui/FormInput.tsx`
- Extract pattern from `AuthInput.tsx`
- Generic input with label, error state, and validation
- Support text, textarea modes
- Used by both auth forms and prompt editor

### 1.2 Extract `FormTextarea` component
**File:** `src/components/ui/FormTextarea.tsx`
- Similar to FormInput but for multiline text
- Auto-resize capability
- Support markdown preview toggle (future)

### 1.3 Create `StatusBadge` component
**File:** `src/components/ui/StatusBadge.tsx`
- Display draft/published status
- Color-coded: gray for draft, green for published
- Compact design for cards and lists

## Part 2: Admin-Specific Components

### 2.1 `PromptEditorDialog` component
**File:** `src/components/prompt-manager/admin/PromptEditorDialog.tsx`
- Reuse `ConfirmDialog` pattern from SaveRuleCollectionDialog
- Form fields: title (input), collection (dropdown), segment (dropdown), markdown_body (textarea)
- Client-side validation (required fields)
- Loading state during save
- Error display
- Support create + edit modes (initialData prop)

### 2.2 `AdminPromptCard` component
**File:** `src/components/prompt-manager/admin/AdminPromptCard.tsx`
- Based on RuleCollectionListEntry pattern
- Shows: title, preview, collection/segment badges, status badge, updated date
- Actions: Edit (pencil icon), Delete (trash icon), Publish toggle (toggle switch or button)
- Hover actions pattern from RuleCollectionListEntry
- Click to select/preview in detail view

### 2.3 `AdminPromptsList` component
**File:** `src/components/prompt-manager/admin/AdminPromptsList.tsx`
- Grid layout similar to PromptsList
- Map prompts to AdminPromptCard components
- Show "Create New Prompt" button (similar to RuleCollectionsList)
- Handle loading, error, empty states
- Support filters (status: all/draft/published)

### 2.4 `PromptsAdminPanel` component
**File:** `src/components/prompt-manager/admin/PromptsAdminPanel.tsx`
- Main admin container (similar to PromptsBrowser)
- Top section: OrganizationSelector + status filter dropdown + search
- Main section: AdminPromptsList
- Side panel/modal: PromptDetail (reuse existing) or PromptEditorDialog
- Manage dialog states (editor open/closed, delete confirmation)

## Part 3: Store Enhancement

### 3.1 Extend `promptsStore` with admin actions
**File:** `src/store/promptsStore.ts`

Add to state:
```typescript
// Admin-specific state
adminPrompts: Prompt[]; // includes drafts
isAdminMode: boolean;
statusFilter: 'all' | 'draft' | 'published';
```

Add actions:
```typescript
// Admin CRUD
createPrompt: (data: CreatePromptInput) => Promise<void>
updatePrompt: (id: string, data: UpdatePromptInput) => Promise<void>
deletePrompt: (id: string) => Promise<void>
togglePublishStatus: (id: string) => Promise<void>

// Admin fetching (includes drafts)
fetchAdminPrompts: (filters) => Promise<void>

// Filters
setStatusFilter: (status) => void
setAdminMode: (enabled: boolean) => void
```

Implementation notes:
- Use admin API endpoints (`/api/prompts/admin/*`)
- Handle errors with user-friendly messages
- Optimistic updates for toggle publish
- Refetch after mutations

## Part 4: Admin Page

### 4.1 Create admin page
**File:** `src/pages/prompts/admin/index.astro`
```astro
---
import Layout from '../../../layouts/Layout.astro';
import Topbar from '../../../components/Topbar';
import Footer from '../../../components/Footer';
import PromptsAdminPanel from '../../../components/prompt-manager/admin/PromptsAdminPanel';

const user = Astro.locals.user;
// Middleware already ensures admin access
---
<Layout>
  <div class="flex flex-col h-screen max-h-screen bg-gray-950 overflow-hidden">
    <Topbar client:load initialUser={user} />
    <main class="flex-grow overflow-auto">
      <PromptsAdminPanel client:load />
    </main>
    <Footer client:load />
  </div>
</Layout>
```

## Part 5: Integration & Polish

### 5.1 Add navigation link
- Add "Admin Panel" link in Topbar for admin users
- Conditional render based on admin role
- Highlight active state when on admin routes

### 5.2 Error handling & validation
- Form validation in PromptEditorDialog
- API error display with toast/inline messages
- Confirmation dialog for destructive actions (delete)

### 5.3 Optimistic updates
- Toggle publish status immediately, rollback on error
- Show loading spinners during mutations

## Implementation Order

1. **Part 1 (Reusable UI):** FormInput, FormTextarea, StatusBadge
2. **Part 3 (Store):** Extend promptsStore with admin actions
3. **Part 2 (Admin Components):** PromptEditorDialog → AdminPromptCard → AdminPromptsList → PromptsAdminPanel
4. **Part 4 (Page):** Create admin/index.astro
5. **Part 5 (Integration):** Navigation, error handling, polish

## Testing Strategy

- Unit tests: Store admin actions, form validation
- Integration tests: Full admin workflow (create → edit → publish → delete)
- E2E test: Playwright scenario matching US-009 from PRD

## Component Reuse Summary

**Reusing:**
- ConfirmDialog, Dropdown, SearchBar, MarkdownRenderer, CopyDownloadActions
- OrganizationSelector, PromptDetail, PromptFilters
- Patterns from RuleCollectionListEntry (edit/delete actions)
- Patterns from SaveRuleCollectionDialog (form dialog)

**Creating:**
- FormInput, FormTextarea, StatusBadge (generic)
- PromptEditorDialog, AdminPromptCard, AdminPromptsList, PromptsAdminPanel (admin-specific)

**Enhancing:**
- promptsStore (admin actions)

## Detailed Component Specifications

### PromptEditorDialog Props
```typescript
interface PromptEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePromptInput | UpdatePromptInput) => Promise<void>;
  organizationId: string;
  collections: PromptCollection[];
  segments: PromptSegment[];
  initialData?: Prompt; // For edit mode
}
```

### AdminPromptCard Props
```typescript
interface AdminPromptCardProps {
  prompt: Prompt;
  collections: PromptCollection[];
  segments: PromptSegment[];
  onEdit: (prompt: Prompt) => void;
  onDelete: (promptId: string) => void;
  onTogglePublish: (promptId: string) => void;
  onSelect: (promptId: string) => void;
  isSelected?: boolean;
}
```

### PromptsAdminPanel State Management
```typescript
// Local component state
const [isEditorOpen, setIsEditorOpen] = useState(false);
const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [deletingPromptId, setDeletingPromptId] = useState<string | null>(null);

// Store state
const {
  adminPrompts,
  isLoading,
  error,
  activeOrganization,
  collections,
  segments,
  statusFilter,
  searchQuery,
  selectedPromptId,
  // Actions
  fetchAdminPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
  togglePublishStatus,
  setStatusFilter,
  setSearchQuery,
  selectPrompt,
} = usePromptsStore();
```

## API Endpoints Already Implemented

✅ POST `/api/prompts/admin/prompts` - Create prompt
✅ GET `/api/prompts/admin/prompts` - List prompts (with filters)
✅ GET `/api/prompts/admin/prompts/[id]` - Get single prompt
✅ PUT `/api/prompts/admin/prompts/[id]` - Update prompt
✅ DELETE `/api/prompts/admin/prompts/[id]` - Delete prompt
✅ PATCH `/api/prompts/admin/prompts/[id]/publish` - Toggle publish status

All endpoints already enforce:
- Authentication (middleware)
- Admin role check (middleware)
- Organization scoping (service layer)

## PRD Requirements Mapping

### US-005: Admin Panel Access ✓
- Middleware already handles role-based routing
- Admin users see admin panel, members redirected

### US-006: Create and Edit Drafts ✓
- PromptEditorDialog handles both modes
- Form validation before save
- Error handling with inline display

### US-007: Publish Toggle ✓
- AdminPromptCard includes publish toggle
- Optimistic update for instant feedback
- Status change reflects in member view immediately

### US-009: E2E Testing ✓
- Playwright scenario: create draft → edit → publish → member views

## Success Criteria (from Phase 5 in POC Plan)

✅ Admin walkthrough demo-ready:
1. Switch organization via OrganizationSelector
2. Create new draft via "New Prompt" button
3. Edit draft via pencil icon
4. Publish via toggle button
5. Verify appears in member view

✅ Admin-only UI route at `/prompts/admin`
✅ Organization selector with active org context
✅ Draft list view with filters
✅ Editor form (Markdown) with validation
✅ Simple publish toggle (no diffing/bulk in POC)
✅ API integration with error handling
✅ Behind feature flag and access check
