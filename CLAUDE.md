# CLAUDE.md

This file provides guidance to AI Agents when working with code in this repository.

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
- `npm run generate-rules` - Generate rules JSON from TypeScript definitions

## Architecture Overview

### Technology Stack
- **Framework**: Astro 5 with React 18.3 integration
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand for client-side state
- **Database**: Supabase (PostgreSQL with real-time features)
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Authentication**: Supabase Auth with email/password and password reset

### Project Structure

#### Core Application (`src/`)
- `pages/` - Astro pages with API routes under `api/`
- `components/` - React components organized by feature
- `data/` - Static data including AI rules definitions in `rules/` subdirectory
- `services/` - Business logic services, notably `RulesBuilderService`
- `store/` - Zustand stores for state management
- `hooks/` - Custom React hooks

#### Key Components Architecture
- **Rules System**: Rules are organized by technology stacks (frontend, backend, database, etc.) and stored in `src/data/rules/`
- **Rules Builder Service**: Core service in `src/services/rules-builder/` that generates markdown content using strategy pattern (single-file vs multi-file output)
- **Collections System**: User can save and manage rule collections via `collectionsStore`
- **Feature Flags**: Environment-based feature toggling system in `src/features/featureFlags.ts`

#### MCP Server (`mcp-server/`)
Standalone Cloudflare Worker implementing Model Context Protocol for programmatic access to AI rules. Provides tools:
- `listAvailableRules` - Get available rule categories
- `getRuleContent` - Fetch specific rule content

### State Management Pattern
The application uses Zustand with multiple specialized stores:
- `techStackStore` - Manages selected libraries and tech stack
- `collectionsStore` - Handles saved rule collections with dirty state tracking
- `authStore` - Authentication state management
- `projectStore` - Project metadata (name, description)

### Environment Configuration
- Uses Astro's environment schema for type-safe environment variables
- Supports three environments: `local`, `integration`, `prod`
- Feature flags control functionality per environment
- Requires `.env.local` with Supabase credentials and Cloudflare Turnstile keys

### Database Integration
- Supabase integration with TypeScript types in `src/db/database.types.ts`
- Collections are stored in Supabase with user association
- Real-time capabilities available but not currently utilized

### Testing Strategy
- Unit tests use Vitest with React Testing Library and JSDOM
- E2E tests use Playwright with Page Object Model pattern
- Test files located in `tests/` for unit tests and `e2e/` for E2E tests
- All tests run in CI/CD pipeline

### Rules Content System
Rules are defined as TypeScript objects and exported from category-specific files in `src/data/rules/`. The system supports:
- Categorization by technology layers (frontend, backend, database, etc.)
- Library-specific rules with placeholder replacement
- Multi-file vs single-file output strategies
- Markdown generation with project context

### Development Workflow
1. Rules contributions go in `src/data/rules/` with corresponding translations in `src/i18n/translations.ts`
2. Use feature flags to control new functionality rollout
3. Collections allow users to save and share rule combinations
4. The MCP server enables programmatic access for AI assistants