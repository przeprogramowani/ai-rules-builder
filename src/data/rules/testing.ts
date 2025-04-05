import { Library } from '../dictionaries';
import { type LibraryRulesMap } from './types';

/**
 * Testing library rules (Unit, Integration, E2E)
 */
export const testingRules: LibraryRulesMap = {
  // Unit testing libraries
  [Library.JEST]: [
    'Use Jest with TypeScript for type checking in tests',
    'Implement Testing Library for component testing instead of enzyme',
    'Use snapshot testing sparingly and only for stable UI components',
    'Leverage mock functions and spies for isolating units of code',
    'Implement test setup and teardown with beforeEach and afterEach',
    'Use describe blocks for organizing related tests',
    'Leverage expect assertions with specific matchers',
    'Implement code coverage reporting with meaningful targets',
    'Use mockResolvedValue and mockRejectedValue for async testing',
    'Leverage fake timers for testing time-dependent functionality',
  ],
  [Library.VITEST]: [
    'Leverage the `vi` object for test doubles - Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions, and `vi.stubGlobal()` for global mocks. Prefer spies over mocks when you only need to verify interactions without changing behavior.',
    'Master `vi.mock()` factory patterns - Place mock factory functions at the top level of your test file, return typed mock implementations, and use `mockImplementation()` or `mockReturnValue()` for dynamic control during tests. Remember the factory runs before imports are processed.',
    'Create setup files for reusable configuration - Define global mocks, custom matchers, and environment setup in dedicated files referenced in your `vitest.config.ts`. This keeps your test files clean while ensuring consistent test environments.',
    'Use inline snapshots for readable assertions - Replace complex equality checks with `expect(value).toMatchInlineSnapshot()` to capture expected output directly in your test file, making changes more visible in code reviews.',
    'Monitor coverage with purpose and only when asked - Configure coverage thresholds in `vitest.config.ts` to ensure critical code paths are tested, but focus on meaningful tests rather than arbitrary coverage percentages.',
    'Make watch mode part of your workflow - Run `vitest --watch` during development for instant feedback as you modify code, filtering tests with `-t` to focus on specific areas under development.',
    'Explore UI mode for complex test suites - Use `vitest --ui` to visually navigate large test suites, inspect test results, and debug failures more efficiently during development.',
    'Handle optional dependencies with smart mocking - Use conditional mocking to test code with optional dependencies by implementing `vi.mock()` with the factory pattern for modules that might not be available in all environments.',
    "Configure jsdom for DOM testing - Set `environment: 'jsdom'` in your configuration for frontend component tests and combine with testing-library utilities for realistic user interaction simulation.",
    'Structure tests for maintainability - Group related tests with descriptive `describe` blocks, use explicit assertion messages, and follow the Arrange-Act-Assert pattern to make tests self-documenting.',

    'Leverage TypeScript type checking in tests - Enable strict typing in your tests to catch type errors early, use `expectTypeOf()` for type-level assertions, and ensure mocks preserve the original type signatures.',
  ],
  [Library.MOCHA]: [
    'Use Chai for assertions and Sinon for mocks and spies',
    'Implement the AAA (Arrange-Act-Assert) pattern for test structure',
    'Use before/after hooks for setup and teardown of {{test_dependencies}}',
  ],
  [Library.PYTEST]: [
    'Use fixtures for test setup and dependency injection',
    'Implement parameterized tests for testing multiple inputs for {{function_types}}',
    'Use monkeypatch for mocking dependencies',
  ],

  // Integration testing libraries
  [Library.SUPERTEST]: [
    'Use async/await with supertest for cleaner test code',
    'Implement a test database for integration tests',
    'Use beforeEach/afterEach hooks for database setup and teardown when testing {{api_endpoints}}',
  ],

  // E2E testing libraries
  [Library.CYPRESS]: [
    'Use component testing for testing components in isolation',
    'Implement E2E testing for critical user flows',
    'Use cy.intercept() for network request mocking and stubbing',
    'Leverage custom commands for reusable test steps',
    'Implement fixtures for test data',
    'Use data-* attributes for test selectors instead of CSS classes or IDs',
    'Leverage the Testing Library integration for better queries',
    'Implement retry-ability for flaky tests',
    'Use the Cypress Dashboard for CI integration and test analytics',
    'Leverage visual testing for UI regression testing',
  ],
  [Library.PLAYWRIGHT]: [
    'Initialize configuration only with Chromium/Desktop Chrome browser',
    'Use browser contexts for isolating test environments',
    'Implement the Page Object Model for maintainable tests',
    'Use locators for resilient element selection',
    'Leverage API testing for backend validation',
    'Implement visual comparison with expect(page).toHaveScreenshot()',
    'Use the codegen tool for test recording',
    'Leverage trace viewer for debugging test failures',
    'Implement test hooks for setup and teardown',
    'Use expect assertions with specific matchers',
    'Leverage parallel execution for faster test runs',
  ],
  [Library.SELENIUM]: [
    'Use the page object model to organize test code',
    'Implement explicit waits instead of implicit waits for {{dynamic_elements}}',
    'Use the WebDriverWait class for waiting for elements to be ready',
  ],
};
