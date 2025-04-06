import { Library } from '../dictionaries';
import { type LibraryRulesMap } from './types';

/**
 * Coding practices library rules (Code Quality, Documentation, Version Control, Architecture)
 */
export const codingRules: LibraryRulesMap = {
  [Library.SUPPORT_BEGINNER]: [
    'When running in agent mode, execute up to 3 actions at a time and ask for approval or course correction afterwards.',
    'Write code with clear variable names and include explanatory comments for non-obvious logic. Avoid shorthand syntax and complex patterns.',
    'Provide full implementations rather than partial snippets. Include import statements, required dependencies, and initialization code.',
    'Add defensive coding patterns and clear error handling. Include validation for user inputs and explicit type checking.',
    'Suggest simpler solutions first, then offer more optimized versions with explanations of the trade-offs.',
    'Briefly explain why certain approaches are used and link to relevant documentation or learning resources.',
    'When suggesting fixes for errors, explain the root cause and how the solution addresses it to build understanding. Ask for confirmation before proceeding.',
    'Offer introducing basic test cases that demonstrate how the code works and common edge cases to consider.',
  ],

  [Library.SUPPORT_EXPERT]: [
    'Favor elegant, maintainable solutions over verbose code. Assume understanding of language idioms and design patterns.',
    'Highlight potential performance implications and optimization opportunities in suggested code.',
    'Frame solutions within broader architectural contexts and suggest design alternatives when appropriate.',
    "Focus comments on 'why' not 'what' - assume code readability through well-named functions and variables.",
    'Proactively address edge cases, race conditions, and security considerations without being prompted.',
    'When debugging, provide targeted diagnostic approaches rather than shotgun solutions.',
    'Suggest comprehensive testing strategies rather than just example tests, including considerations for mocking, test organization, and coverage.',
  ],

  // Code Quality libraries
  [Library.ESLINT]: [
    'Configure project-specific rules in eslint.config.js to enforce consistent coding standards',
    'Use shareable configs like eslint-config-airbnb or eslint-config-standard as a foundation',
    'Implement custom rules for {{project_specific_patterns}} to maintain codebase consistency',
    'Configure integration with Prettier to avoid rule conflicts for code formatting',
    'Use the --fix flag in CI/CD pipelines to automatically correct fixable issues',
    'Implement staged linting with husky and lint-staged to prevent committing non-compliant code',
  ],
  [Library.PRETTIER]: [
    'Define a consistent .prettierrc configuration across all {{project_repositories}}',
    'Configure editor integration to format on save for immediate feedback',
    'Use .prettierignore to exclude generated files, build artifacts, and {{specific_excluded_patterns}}',
    'Set printWidth based on team preferences (80-120 characters) to improve code readability',
    'Configure consistent quote style and semicolon usage to match team conventions',
    'Implement CI checks to ensure all committed code adheres to the defined style',
  ],
  [Library.SONARQUBE]: [
    'Configure quality gates with appropriate thresholds for {{critical_metrics}}',
    'Set up branch analysis to track quality metrics across different development branches',
    'Implement custom quality profiles tailored to {{language_specific_requirements}}',
    'Configure security hotspot reviews as part of the development workflow',
    'Use SonarLint IDE integration to catch issues before they reach the repository',
    'Set up pull request decoration to provide feedback during code review process',
  ],
  [Library.CODECOV]: [
    'Set minimum coverage thresholds for {{critical_code_paths}} to ensure adequate testing',
    'Configure path-specific coverage targets based on risk assessment',
    'Use coverage flags to categorize tests (unit, integration, e2e) for better reporting',
    'Implement coverage checks in CI/CD pipelines to prevent coverage regression',
    'Configure branch coverage in addition to line coverage for more thorough analysis',
    'Set up pull request comments to highlight coverage changes during review',
  ],

  [Library.DOC_UPDATES]: [
    'Update relevant documentation in /docs when modifying features',
    'Keep README.md in sync with new capabilities',
    'Maintain changelog entries in CHANGELOG.md',
  ],
  [Library.ADR]: [
    'Create ADRs in /docs/adr/{name}.md for:',
    '1) Major dependency changes',
    '2) Architectural pattern changes',
    '3) New integration patterns',
    '4) Database schema changes',
  ],
  [Library.STORYBOOK]: [
    'Organize stories by component hierarchy to mirror the application structure',
    'Implement comprehensive controls to showcase component variations for {{component_types}}',
    'Use MDX format to combine documentation and live examples for complex components',
    'Configure Storybook addons for accessibility, responsive design, and {{specific_testing_needs}}',
    'Implement design token integration to showcase components with different themes',
    'Create interaction tests to verify component behavior in addition to visual appearance',
  ],
  [Library.SWAGGER]: [
    'Define comprehensive schemas for all request and response objects',
    'Use semantic versioning in API paths to maintain backward compatibility',
    'Implement detailed descriptions for endpoints, parameters, and {{domain_specific_concepts}}',
    'Configure security schemes to document authentication and authorization requirements',
    'Use tags to group related endpoints by resource or functional area',
    'Implement examples for all endpoints to facilitate easier integration by consumers',
  ],
  [Library.TYPEDOC]: [
    'Use JSDoc-style comments with TypeScript-specific annotations for all public APIs',
    'Configure custom themes to match {{project_branding}} for consistent documentation',
    'Group related functionality using @module and @category tags for better organization',
    'Document edge cases and error handling for {{critical_functions}}',
    'Generate and publish documentation as part of the CI/CD pipeline to keep it current',
    'Include usage examples for complex interfaces and abstract classes',
  ],
  [Library.JSDOC]: [
    'Document all functions, classes, and methods with consistent JSDoc comments',
    'Use @param, @returns, and @throws tags to document function behavior comprehensively',
    'Implement @example tags with realistic usage scenarios for {{complex_apis}}',
    'Use @typedef for documenting complex object structures when not using TypeScript',
    'Configure documentation generation as part of the build process to keep docs current',
    'Implement custom templates to match {{project_style_guidelines}}',
  ],

  // Version Control libraries
  [Library.GIT]: [
    'Use conventional commits to create meaningful commit messages',
    'Use feature branches with descriptive names following {{branch_naming_convention}}',
    'Write meaningful commit messages that explain why changes were made, not just what',
    'Keep commits focused on single logical changes to facilitate code review and bisection',
    'Use interactive rebase to clean up history before merging feature branches',
    'Leverage git hooks to enforce code quality checks before commits and pushes',
  ],
  [Library.GITHUB]: [
    'Use pull request templates to standardize information provided for code reviews',
    'Implement branch protection rules for {{protected_branches}} to enforce quality checks',
    'Configure required status checks to prevent merging code that fails tests or linting',
    'Use GitHub Actions for CI/CD workflows to automate testing and deployment',
    'Implement CODEOWNERS files to automatically assign reviewers based on code paths',
    'Use GitHub Projects for tracking work items and connecting them to code changes',
  ],
  [Library.GITLAB]: [
    'Configure GitLab CI/CD with optimized pipelines for {{development_stages}}',
    'Use merge request templates to standardize the review process',
    'Implement merge request approvals with specific approval rules for {{sensitive_areas}}',
    'Configure GitLab Pages to host documentation and reports automatically',
    'Use GitLab Container Registry for storing and versioning Docker images',
    'Leverage GitLab Security features for vulnerability scanning and dependency analysis',
  ],
  [Library.CONVENTIONAL_COMMITS]: [
    'Follow the format: type(scope): description for all commit messages',
    'Use consistent types (feat, fix, docs, style, refactor, test, chore) across the project',
    'Define clear scopes based on {{project_modules}} to indicate affected areas',
    'Include issue references in commit messages to link changes to requirements',
    'Use breaking change footer (!: or BREAKING CHANGE:) to clearly mark incompatible changes',
    'Configure commitlint to automatically enforce conventional commit format',
  ],

  // Architecture libraries
  [Library.CLEAN_ARCHITECTURE]: [
    'Strictly separate code into layers: entities, use cases, interfaces, and frameworks',
    'Ensure dependencies point inward, with inner layers having no knowledge of outer layers',
    'Implement domain entities that encapsulate {{business_rules}} without framework dependencies',
    'Use interfaces (ports) and implementations (adapters) to isolate external dependencies',
    'Create use cases that orchestrate entity interactions for specific business operations',
    'Implement mappers to transform data between layers to maintain separation of concerns',
  ],
  [Library.DDD]: [
    'Define bounded contexts to separate different parts of the domain with clear boundaries',
    'Implement ubiquitous language within each context to align code with business terminology',
    'Create rich domain models with behavior, not just data structures, for {{core_domain_entities}}',
    'Use value objects for concepts with no identity but defined by their attributes',
    'Implement domain events to communicate between bounded contexts',
    'Use aggregates to enforce consistency boundaries and transactional integrity',
  ],
  [Library.MICROSERVICES]: [
    'Design services around business capabilities rather than technical functions',
    'Implement API gateways to handle cross-cutting concerns for {{client_types}}',
    'Use event-driven communication for asynchronous operations between services',
    'Implement circuit breakers to handle failures gracefully in distributed systems',
    'Design for eventual consistency in data that spans multiple services',
    'Implement service discovery and health checks for robust system operation',
  ],
  [Library.MONOREPO]: [
    'Configure workspace-aware tooling to optimize build and test processes',
    'Implement clear package boundaries with explicit dependencies between packages',
    'Use consistent versioning strategy across all packages (independent or lockstep)',
    'Configure CI/CD to build and test only affected packages for efficiency',
    'Implement shared configurations for linting, testing, and {{development_tooling}}',
    'Use code generators to maintain consistency across similar packages or modules',
  ],
};
