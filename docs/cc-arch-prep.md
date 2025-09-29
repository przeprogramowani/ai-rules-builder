# Architecture Preparation: Rules & Prompt Manager Integration (POC-Focused)

## Overview

This document outlines a pragmatic 80/20 approach for integrating Prompt Manager with the existing Rules Manager. Based on the POC plan in `docs/prompt-manager/poc-plan.md`, we'll focus on shipping a working proof of concept in 3 sprints while avoiding overengineering. The goal is to validate core UX and data contracts using existing patterns before expanding to full implementation.

### Core POC Objective (from poc-plan.md)

> **Objective**: Ship a feature-flagged Prompt Manager proof of concept that exercises the core flow (admin curates prompts, learner browses gated list) while deferring advanced workflows like version diffing, automated localization, and rich analytics. Deliver this slice in ~3 sprints to validate UX and data contracts before expanding to the full implementation plan.

### Guiding Constraints (from poc-plan.md)

> - Keep everything behind `PROMPT_MANAGER_ENABLED` so partial work can deploy safely.
> - Reuse existing Astro + Supabase patterns; avoid new infrastructure unless required.
> - Store modules, lessons, and prompts exclusively in Supabase (no repository seeds).
> - For the initial POC, treat every authenticated Supabase account as cohort-eligible; defer Google Sheets roster enforcement to a later iteration triggered on merge to `master`.
> - Provide learner copy-to-clipboard with formatting that behaves well in Cursor.
> - Collect minimal anonymous telemetry (prompt_id, event_type, occurred_at) while planning the hardened approach later.

## Current Architecture Analysis

### Strengths ✅

- **Supabase Integration**: Full auth, RLS, and type generation already in place
- **Feature Flags System**: Ready for prompt manager with `promptManager` and `promptUsageLogging` flags
- **Middleware Architecture**: Auth and access control patterns established (`src/middleware/index.ts`)
- **State Management**: Zustand stores providing clean client-side state
- **API Structure**: RESTful endpoints with proper error handling
- **Database Schema**: Solid foundation with RLS, audit trails, and type safety

### Current Integration Points

- Middleware already handles prompt manager routes (`src/middleware/index.ts:17-23`)
- Access control system implemented (`src/features/prompt-manager/access.ts`)
- Feature flag infrastructure ready (`src/features/featureFlags.ts:14,28,35,42`)
- Database types generated and consistent (`src/db/database.types.ts`)

## Shared Infrastructure Needs

Both features require similar capabilities:

1. **Content Management**
   - Rules: Markdown builders for generation strategies
   - Prompts: Markdown rendering with sanitization for security

2. **User Access Control**
   - Rules: Collection ownership and sharing
   - Prompts: Cohort validation and role-based permissions

3. **Data Models**
   - Both: Versioning, audit trails, soft delete patterns
   - Both: User associations and timestamps

4. **Search & Filtering**
   - Rules: Library/stack-based filtering
   - Prompts: Module/lesson/tag filtering with full-text search

5. **State Management**
   - Both: Zustand for client state with similar patterns
   - Both: Loading states, error handling, dirty state tracking

## POC Architectural Approach (Simplified)

### 1. Minimal Shared Infrastructure

Instead of building complex shared services, reuse existing patterns:

```typescript
// Extend existing patterns, don't create new infrastructure
src/features/prompt-manager/
├── access.ts                    // Already exists - role helpers
├── stores/
│   ├── promptsStore.ts         // Simple Zustand store like collectionsStore
│   └── favoritesStore.ts       // Basic Supabase-backed favorites
└── api/
    ├── prompts.ts              // Basic CRUD following collections pattern
    └── favorites.ts            // Simple toggle operations
```

**Rationale**: Avoid premature abstraction. Build shared utilities only when we have 2+ concrete use cases.

### 2. Feature Flag + Role-Based Access

Use existing middleware patterns with minimal additions:

```typescript
// src/middleware/index.ts - extend existing patterns
- Feature flag check: isPromptManagerEnabled()
- Role check: resolvePromptRole() from user metadata
- Cohort placeholder: allow all authenticated users initially
```

**Rationale**: Leverage existing auth infrastructure, defer complex cohort validation until post-POC.

### 3. Simple State Management

Follow existing store patterns without over-engineering:

```typescript
// Reuse collectionsStore patterns
- Simple loading/error states
- Direct Supabase API calls
- No complex caching or optimistic updates initially
```

**Rationale**: Proven patterns from rules manager, avoid new abstractions until needed.

### 4. Simplified Database Schema (POC)

Use schema from `docs/prompt-manager/schema-proposal.md` with simplifications. The full schema proposal provides this structure for POC implementation:

```sql
-- POC Schema - minimal viable structure
CREATE TABLE prompt_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prompt_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES prompt_modules(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, slug)
);

-- Simplified prompts table - single active version only
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES prompt_modules(id),
  lesson_id UUID REFERENCES prompt_lessons(id),
  title TEXT NOT NULL,
  markdown_body TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic favorites (no complex versioning initially)
CREATE TABLE prompt_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  prompt_id UUID REFERENCES prompts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, prompt_id)
);

-- Minimal telemetry stub
CREATE TABLE prompt_usage_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prompt_id UUID REFERENCES prompts(id),
  action TEXT CHECK (action IN ('view', 'copy', 'favorite')),
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);
```

**POC Simplifications** (based on schema-proposal.md constraints):

From schema proposal: *"For the POC, treat every authenticated Supabase account as cohort-eligible"*
- No `course_cohort_members` or `prompt_access_audit` tables initially
- No complex RLS policies for cohort validation

From poc-plan.md: *"Simplified prompt catalog schema (single active version per prompt)"*
- No `prompt_versions` table (defer version history and diffing)
- No `current_version_id` references in prompts table

From poc-plan.md: *"Collect minimal anonymous telemetry (prompt_id, event_type, occurred_at)"*
- Simplified `prompt_usage_logs` without user tracking or metadata
- No opt-out mechanisms initially (add in post-POC iterations)

### 5. Minimal API Structure (POC)

Keep API structure simple, following existing patterns:

```typescript
// src/pages/api/prompt-manager/
├── modules.ts                  // List modules with lessons
├── prompts.ts                  // List/search prompts (learner)
├── admin/
│   ├── prompts.ts             // Admin CRUD operations
│   └── seed.ts                // Temporary seeding endpoint
└── favorites/
    └── [id].ts                // Toggle favorite for prompt
```

**POC Simplifications**:
- No versioning endpoints (single active version)
- No complex search (basic title filtering)
- No telemetry APIs (automatic logging only)
- No cohort sync endpoints (defer to post-POC)

### 6. Reuse Existing Middleware

Extend current middleware with minimal changes:

```typescript
// src/middleware/index.ts - add to existing patterns
- Check isPromptManagerEnabled() for /prompt-manager routes
- Use existing auth patterns
- Add resolvePromptRole() helper for admin/learner distinction
- Defer complex permission policies
```

**Rationale**: Current middleware already handles prompt manager routes. Add minimal role checking without complex policy system.

## POC Implementation Phases (3 Sprints)

Based on the detailed phase breakdown from `docs/prompt-manager/poc-plan.md`:

### Phase A: Flag & Access Seed (Sprint 1)

From poc-plan.md:
> **Phase A – Flag & Access Seed (Sprint 1)**
> - Add `PROMPT_MANAGER_ENABLED`, `PROMPT_USAGE_LOGGING_ENABLED` to env schema, config, and documentation.
> - Implement `usePromptRoles()` helper that reads `prompt_role` from Supabase user metadata to distinguish admins, moderators, and learners.
> - Wire Astro middleware to enforce feature flag and role guard on `/prompt-manager` routes. Cohort guard returns true for now but exposes hook for future roster validation.
> - Deliver Vitest coverage for helpers and middleware.

**Goal**: Foundation with feature flags and basic access control

1. **Feature Flags**: Add to env schema, config, and documentation as specified
2. **Role Helpers**: Implement `usePromptRoles()` reading `prompt_role` from user metadata
3. **Middleware**: Wire route guards with cohort placeholder returning true for all authenticated users
4. **Testing**: Vitest coverage for helpers and middleware

**Deliverable**: Feature flag infrastructure ready, basic access control working

### Phase B: Prompt Catalog MVP (Sprint 2)

From poc-plan.md:
> **Phase B – Prompt Catalog MVP (Sprint 2)**
> - Create migrations for `prompt_modules`, `prompt_lessons`, `prompts`, `prompt_favorites` in Supabase (no repo-local seeds).
> - Provide temporary admin-only script/API to seed baseline modules/lessons directly into Supabase (read-only in UI).
> - Implement admin APIs for create/edit/publish (single markdown field on `prompts`, `status` enum).
> - Ensure learner API filters to published prompts and uses placeholder cohort guard (allow all for now).

**Goal**: Database schema and basic CRUD operations

1. **Database**: Create migrations for core tables, no repo-local seeds
2. **Seeding**: Admin-only script/API for modules/lessons in Supabase directly
3. **APIs**: Admin CRUD with single markdown field, status enum (draft/published/archived)
4. **RLS Policies**: Learner API filters to published prompts, placeholder cohort guard

**Deliverable**: Working database with basic prompt management

### Phase C: Admin & Learner UI (Sprint 3)

From poc-plan.md:
> **Phase C – Admin & Learner UI Slice (Sprint 3)**
> - Admin route `/prompt-manager/admin`: table view, edit modal (markdown textarea), publish toggle, role-based access (admins/moderators).
> - Learner route `/prompt-manager`: module tabs (from Supabase), lesson dropdown, search by title, prompt detail drawer.
> - Add favorites button (Supabase-backed) and copy-to-clipboard action with formatting that avoids Cursor issues (e.g., plain text copy, sanitized markdown).
> - Display localization banner ("PL content, translations coming soon").

**Goal**: Functional UI for both admin curation and learner browsing

1. **Admin UI**: `/prompt-manager/admin` with table, edit modal (markdown textarea), publish toggle
2. **Learner UI**: `/prompt-manager` with module tabs, lesson dropdown, search by title, prompt detail drawer
3. **Core Features**: Supabase-backed favorites, copy-to-clipboard with Cursor-compatible formatting
4. **Localization**: Banner stating "PL content, translations coming soon"

**Deliverable**: Working end-to-end flow from admin publish to learner consumption

### Phase D: Telemetry & QA (Sprint 3 continued)

From poc-plan.md:
> **Phase D – Telemetry Stub & QA (Sprint 3)**
> - Create `prompt_usage_events` table storing `prompt_id`, `event_type`, `occurred_at` only; gate inserts behind `PROMPT_USAGE_LOGGING_ENABLED`.
> - Frontend hook fires `view` and `favorite` events when enabled; fallback to console log otherwise.
> - Add Vitest specs for telemetry hook toggles and Playwright smoke test covering admin publish → learner copy/favorite flow.
> - Update README/docs with POC setup, limitations, and next steps.

**Goal**: Basic telemetry and comprehensive testing

1. **Telemetry**: `prompt_usage_events` table with minimal fields, gated by feature flag
2. **Frontend Hook**: Fire view/favorite events when enabled, console log fallback
3. **Testing**: Vitest specs for telemetry toggles, Playwright for admin → learner flow
4. **Documentation**: README updates with POC setup, limitations, next steps

**Deliverable**: Production-ready POC with basic analytics

## POC Deferred Complexity

### What We're NOT Building in POC

Based on explicit deferred items from poc-plan.md:

> **Deferred Until Post-POC**
> - Build-time Google Sheets roster sync run on merge to `master`.
> - Automated nightly sync & failure auditing.
> - Version history, diffing, bulk publish, moderator workflow UI refinements.
> - Anonymous telemetry hardening (opt-out, metadata hashing, dashboards).
> - Automated localization pipeline, language switcher, offline access.

1. **Version History & Diffing**
   - Deferred: Version history, diffing, bulk publish per poc-plan.md
   - POC: Single active version per prompt, simple edit/publish flow

2. **Google Sheets Cohort Sync**
   - Deferred: Build-time roster sync, automated nightly sync, failure auditing
   - POC: All authenticated users allowed, placeholder for future integration

3. **Advanced Telemetry**
   - Deferred: Anonymous telemetry hardening, opt-out, metadata hashing, dashboards
   - POC: Basic anonymous logging with feature flag toggle

4. **Rich Content Management**
   - Deferred: Moderator workflow UI refinements, bulk operations
   - POC: Simple markdown text area, basic publish toggle

5. **Localization & Offline**
   - Deferred: Automated localization pipeline, language switcher, offline access
   - POC: Polish content only with "translations coming soon" banner

## Critical POC Questions & Decisions

### Phase A Decisions (Sprint 1)

#### User Metadata Structure
- **Question**: How should prompt roles be stored in Supabase user metadata?
- **Options**: `prompt_role: 'admin' | 'learner'` vs nested object
- **POC Decision**: Simple string field `prompt_role` with default 'learner'
- **Timeline**: Sprint 1 start

#### Feature Flag Configuration
- **Question**: Should feature flags be environment-specific or user-specific?
- **POC Decision**: Environment-specific only (existing pattern)
- **Timeline**: Sprint 1 start

### Phase B Decisions (Sprint 2)

#### Module/Lesson Seeding
- **Question**: How should we populate initial modules and lessons?
- **Options**: SQL seed data vs JSON import vs manual admin UI
- **POC Decision**: SQL seed in migration + temporary admin API for edits
- **Timeline**: Sprint 2 start

#### Markdown Rendering
- **Question**: Which markdown library for secure rendering?
- **POC Decision**: Use existing patterns from rules manager if any, otherwise simple `marked` with sanitization
- **Timeline**: Sprint 2 start

### Phase C Decisions (Sprint 3)

#### Copy-to-Clipboard Format
- **Question**: What format should clipboard content use for Cursor compatibility?
- **Options**: Plain text, formatted markdown, HTML
- **POC Decision**: Plain text with basic formatting to avoid Cursor issues
- **Timeline**: Sprint 3 start

#### Navigation Integration
- **Question**: How should prompt manager integrate with existing navigation?
- **POC Decision**: Separate section in authenticated navbar, no cross-feature navigation yet
- **Timeline**: Sprint 3 start

## Post-POC Evolution Path

From the full vision in `.ai/prompt-manager-plan.md`:

### Immediate Post-POC (Sprint 4-6)

Based on deferred POC items and full plan requirements:

1. **Google Sheets Integration**: Implement the cohort validation described in prompt-manager-plan.md:
   > *"Enforce access to eligible cohort members by validating Supabase identities against the Circle.so roster kept in Google Sheets."*

2. **Version History**: Add the versioning system from full plan:
   > *"Version history persists each published revision. Learners access history via an overflow/action menu; admins see full timeline stats."*

3. **Enhanced Telemetry**: Implement full privacy controls:
   > *"Provide per-user opt-out toggle stored server-side; when disabled, stop recording events and rely solely on local state."*

### Medium Term (Month 2-3)

Implement remaining core features from prompt-manager-plan.md:

1. **Admin Workflow**: Full content management system:
   > *"UI for creating drafts, editing drafts, promoting drafts to published versions, and creating new drafts from published content."*

2. **Rich Search**: Comprehensive filtering:
   > *"Rich filter & search UX: by module, lesson, tags (derived from seeded list or computed), and text query."*

3. **Cross-Device Sync**: Enhanced favorites:
   > *"Favorites tab backed by Supabase for cross-device sync. LocalStorage mirror available when users opt out of telemetry."*

### Long Term (Month 4+)

Advanced features from the full implementation plan:

1. **Analytics Dashboard**: For administrators:
   > *"Expose analytics dashboard (future) for admins; for MVP ensure data is collected with minimal PII"*

2. **Content Workflow**: Advanced publishing:
   > *"Change review screen shows diff between draft and current published version before publishing."*

3. **Performance & Scale**: Production optimizations per the technical considerations

## POC Success Metrics

### Technical Metrics (POC)
- **Delivery Timeline**: Complete POC in 3 sprints as planned
- **Code Quality**: Maintain existing test coverage, follow established patterns
- **Performance**: No measurable impact on rules manager performance
- **Reliability**: POC features work consistently behind feature flag

### User Experience Metrics (POC)
- **Core Flow Validation**: Admin can publish prompts, learners can browse/copy
- **Feature Flag Control**: Clean enable/disable without affecting rules manager
- **Basic Usability**: Copy-to-clipboard works reliably in Cursor/IDE
- **Role-Based Access**: Admin vs learner permissions function correctly

### Business Metrics (POC)
- **Validation**: Stakeholders can evaluate UX and data contracts
- **Risk Mitigation**: POC deployment doesn't impact existing users
- **Learning**: Clear understanding of post-POC requirements and complexity

## Immediate Next Steps

1. **Stakeholder Alignment**: Review POC scope and get approval for 3-sprint timeline
2. **Database Design**: Finalize simplified schema and create first migration
3. **Feature Flag Setup**: Add new flags to existing configuration system
4. **Sprint Planning**: Break down phases into specific tickets with acceptance criteria
5. **Risk Assessment**: Identify potential blockers and mitigation strategies

## Risk Mitigation

### POC-Specific Risks

From poc-plan.md risk assessment:

> **Risks & Mitigations**
> - Without roster validation, early testers might see prompts unexpectedly—limit feature flag access to trusted cohort.
> - Lack of versioning means edits overwrite drafts: communicate constraint and limit pilot to controlled admins.
> - Copy-to-clipboard reliability: test across Cursor/Windsurf early to catch formatting issues.

**Identified Risks:**
- **Early Access**: Testers seeing prompts without roster validation
- **Data Loss**: Edits overwriting drafts without version history
- **Clipboard Issues**: Copy formatting problems in IDEs
- **Scope Creep**: Adding features beyond POC scope

### Mitigation Strategies

**From POC plan and architectural constraints:**
- **Feature Flag Control**: Limit `PROMPT_MANAGER_ENABLED` to trusted environments initially
- **Admin Communication**: Clear messaging about draft overwrite limitations
- **IDE Testing**: Early validation of copy-to-clipboard across Cursor/Windsurf
- **Rollback Plan**: Quick feature flag disable restores original behavior
- **Documentation**: Clear POC limitations and setup guides

## Comparative Analysis: cc-arch-prep vs codex-arch-prep

### Why This Approach (cc-arch-prep) is Better

**1. Clearer Decision Context**
- **Direct Quotes**: Every major decision includes exact quotes from source documents
- **Traceable Requirements**: Can trace each POC phase requirement back to poc-plan.md
- **Complete Knowledge Base**: Contains all context needed without external document lookup
- **vs codex-arch-prep**: More scattered references, requires reading multiple docs to understand rationale

**2. Structured Implementation Guidance**
- **Phase-by-Phase Detail**: Each sprint phase includes exact deliverables from poc-plan.md
- **Explicit Simplifications**: Clear reasoning for what's deferred and why
- **Risk Assessment**: Direct quotes from poc-plan.md risk analysis with specific mitigations
- **vs codex-arch-prep**: More general guidance, less specific about sprint boundaries

**3. Future Evolution Path**
- **Post-POC Roadmap**: Clear progression from POC to full implementation
- **Long-term Vision**: Quotes from prompt-manager-plan.md showing final state
- **Migration Strategy**: How to evolve simplified POC schema to full system
- **vs codex-arch-prep**: Focuses primarily on POC with less post-POC guidance

**4. Comprehensive Scope Coverage**
- **Full Architecture View**: Covers both features and their integration patterns
- **Shared Infrastructure**: Identifies reusable patterns between rules and prompts
- **Cross-Feature Impact**: Considers how prompt manager affects existing rules manager
- **vs codex-arch-prep**: Narrower focus on prompt manager implementation only

### Why This Approach is Worse

**1. More Complex Documentation**
- **Longer Document**: More comprehensive but potentially overwhelming
- **Multiple Contexts**: Covers both POC and long-term vision, could be confusing
- **Higher Abstraction**: Discusses architectural patterns that may not be immediately needed
- **vs codex-arch-prep**: More focused, easier to digest, directly actionable

**2. Potential Over-Engineering Risk**
- **Broader Scope**: Tempting to implement shared services before they're proven necessary
- **Future-Proofing**: May lead to premature optimization for post-POC features
- **Analysis Paralysis**: Too many considerations could delay POC implementation
- **vs codex-arch-prep**: Laser-focused on POC delivery, less risk of scope creep

**3. Less Tactical Implementation Detail**
- **Higher Level**: More strategic than tactical in some sections
- **Generic Patterns**: Discusses general architectural improvements vs specific code locations
- **Implementation Gaps**: Some sections need more detailed technical specifications
- **vs codex-arch-prep**: More specific file paths, function names, exact implementation steps

**4. Team Coordination Overhead**
- **Multiple Stakeholders**: Addresses broader architectural concerns requiring more alignment
- **Cross-Team Impact**: Changes affect both features, requiring more coordination
- **Decision Dependencies**: Some architectural decisions block others, creating sequencing challenges
- **vs codex-arch-prep**: Self-contained prompt manager work with minimal dependencies

### Recommendation

**Use codex-arch-prep for POC implementation** because:
- More focused on immediate deliverables
- Clearer tactical implementation guidance
- Less risk of scope creep during POC phase
- Easier for team to follow without extensive architectural discussions

**Use cc-arch-prep for post-POC planning** because:
- Better long-term architectural vision
- More comprehensive cross-feature integration
- Clearer evolution path from POC to full implementation
- Better foundation for scaling both features together

### Hybrid Approach

**Phase 1 (POC)**: Follow codex-arch-prep implementation tracks
**Phase 2 (Post-POC)**: Use cc-arch-prep evolution path and shared infrastructure guidance
**Phase 3 (Integration)**: Apply cc-arch-prep cross-feature patterns and architectural improvements

This allows focused POC delivery while maintaining clear vision for architectural evolution.

---

*This document should be reviewed and updated as decisions are made and implementation progresses.*