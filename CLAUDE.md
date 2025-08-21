# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development Server
- `npm run dev` - Start development server on port 3000 (local mode)
- `npm run dev:e2e` - Start development server in integration mode for E2E testing

### Building and Deployment
- `npm run build` - Build the Astro application for production
- `npm run preview` - Preview the built application locally

### Code Quality
- `npm run lint` - Lint and fix TypeScript/Astro files
- `npm run lint:check` - Check linting without fixing
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without fixing

### Testing
- `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode  
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:e2e:codegen` - Generate test code with Playwright

### Special Scripts
- `npm run generate-rules` - Generate rules JSON from TypeScript definitions (required before running MCP server locally)

## Architecture Overview

### Technology Stack
- **Framework**: Astro 5 with React 18.3 integration
- **Styling**: Tailwind CSS 4 with Typography plugin
- **State Management**: Zustand for client-side state with URL persistence
- **Database**: Supabase (PostgreSQL with auth and real-time features)
- **Testing**: Vitest (unit tests with JSDOM), Playwright (E2E with Page Object Model)
- **Authentication**: Supabase Auth with email/password and password reset flow
- **Validation**: Zod for schema validation, React Hook Form for forms
- **Build Tools**: TypeScript 5, TSX for scripts

### Project Structure

#### Core Application (`src/`)
- `pages/` - Astro pages with API routes under `api/`
- `components/` - React components organized by feature
- `data/` - Static data including AI rules definitions in `rules/` subdirectory
- `services/` - Business logic services, notably `RulesBuilderService`
- `store/` - Zustand stores for state management
- `hooks/` - Custom React hooks
- `features/` - Feature flags system for environment-based functionality control
- `i18n/` - Internationalization with translations
- `db/` - Database types and utilities

#### Key Components Architecture
- **Rules System**: Rules are organized by technology stacks (frontend, backend, database, etc.) and stored in `src/data/rules/`. Each rule category exports typed rule arrays.
- **Rules Builder Service**: Core service in `src/services/rules-builder/` that generates markdown content using strategy pattern (single-file vs multi-file output strategies)
- **Collections System**: User can save and manage rule collections via `collectionsStore` with dirty state tracking and Supabase persistence
- **Feature Flags**: Environment-based feature toggling system in `src/features/featureFlags.ts` controlling API endpoints, pages, and UI components

#### MCP Server (`mcp-server/`)
Standalone Cloudflare Worker implementing Model Context Protocol for programmatic access to AI rules. Provides tools:
- `listAvailableRules` - Get available rule categories with identifiers and stack hierarchy
- `getRuleContent` - Fetch specific rule content by library identifier

Deployed at: `https://10x-rules-mcp-server.przeprogramowani.workers.dev/sse`

### State Management Pattern
The application uses Zustand with multiple specialized stores:
- `techStackStore` - Manages selected libraries and tech stack with URL sync
- `collectionsStore` - Handles saved rule collections with dirty state tracking
- `authStore` - Authentication state management with Supabase session handling
- `projectStore` - Project metadata (name, description) with URL persistence
- `navigationStore` - UI navigation state

### Environment Configuration
- Uses Astro's environment schema for type-safe environment variables
- Supports three environments: `local`, `integration`, `prod` (via `PUBLIC_ENV_NAME`)
- Feature flags control functionality per environment (.ai/feature-flags.md)
- Requires `.env.local` with Supabase credentials and Cloudflare Turnstile keys

### Database Integration
- Supabase integration with TypeScript types in `src/db/database.types.ts`
- Collections are stored in Supabase with user association
- Authentication flow includes email verification and password reset
- Rate limiting implemented for API endpoints

### Testing Strategy
- Unit tests use Vitest with React Testing Library and JSDOM environment
- E2E tests use Playwright with Page Object Model pattern
- Test setup includes MSW for API mocking
- Tests run in CI/CD pipeline via GitHub Actions
- E2E tests use `.env.integration` for isolated testing environment

### Rules Content System
Rules are defined as TypeScript objects and exported from category-specific files in `src/data/rules/`. The system supports:
- Categorization by technology layers (frontend, backend, database, testing, infrastructure, accessibility, coding standards)
- Library-specific rules with placeholder replacement ({{project_name}}, {{library}})
- Multi-file vs single-file output strategies based on editor type
- Markdown generation with project context and library-specific content

### Development Workflow
1. Rules contributions go in `src/data/rules/` with corresponding translations in `src/i18n/translations.ts` (unit tests will fail without translations)
2. Use feature flags to control new functionality rollout across environments
3. Collections allow users to save and share rule combinations with authentication
4. The MCP server enables programmatic access for AI assistants (Cursor, Claude, etc.)
5. Run `npm run generate-rules` after modifying rules to update `preparedRules.json` for MCP server