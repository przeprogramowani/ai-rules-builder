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
    'Leverage the vi object for mocks and spies',
    'Use the setup files for global test configuration',
    'Leverage the inline snapshot feature for small snapshots',
    'Implement coverage reporting with @vitest/coverage-v8 integration',
    'Use the watch mode for development',
    'Leverage the UI mode for interactive test exploration',
    'Implement mocking for modules and dependencies',
    'Use jsdom for DOM testing environment',
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
