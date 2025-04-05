import type { Layer, Stack, Library } from '../data/dictionaries';

export const layerTranslations: Record<Layer, string> = {
  CODING_PRACTICES: 'Coding practices',
  FRONTEND: 'Frontend',
  BACKEND: 'Backend',
  DATABASE: 'Database',
  DEVOPS: 'DevOps',
  TESTING: 'Testing',
} as const;

export const stackTranslations: Record<Stack, string> = {
  // Frontend stacks
  REACT: 'React',
  VUE: 'Vue',
  ANGULAR: 'Angular',
  SVELTE: 'Svelte',
  ASTRO: 'Astro',
  STYLING: 'Styling',

  // Backend stacks
  NODE: 'Node.js',
  PYTHON: 'Python',
  JAVA: 'Java',
  DOTNET: '.NET',
  GO: 'Go',

  // Database stacks
  SQL: 'SQL',
  NOSQL: 'NoSQL',
  GRAPH: 'Graph',

  // DevOps stacks
  CI_CD: 'CI/CD',
  CONTAINERIZATION: 'Containerization',
  CLOUD: 'Cloud',

  // Testing stacks
  UNIT: 'Unit Testing',
  INTEGRATION: 'Integration Testing',
  E2E: 'End-to-End Testing',

  // Coding practices
  SUPPORT_LEVEL: 'AI Support Level',
  VERSION_CONTROL: 'Version Control',
  DOCUMENTATION: 'Documentation',
  ARCHITECTURE: 'Architecture',
  STATIC_ANALYSIS: 'Static analysis',
  ACCESSIBILITY: 'Accessibility',
} as const;

export const libraryTranslations: Record<Library, string> = {
  // React libraries
  REACT_CODING_STANDARDS: 'React Coding Standards',
  NEXT_JS: 'Next.js',
  REACT_ROUTER: 'React Router',
  REDUX: 'Redux',
  ZUSTAND: 'Zustand',
  REACT_QUERY: 'React Query',

  // Vue libraries
  VUE_CODING_STANDARDS: 'Vue Coding Standards',
  NUXT: 'Nuxt',
  VUEX: 'Vuex',
  VUE_ROUTER: 'Vue Router',
  PINIA: 'Pinia',

  // Angular libraries
  ANGULAR_CODING_STANDARDS: 'Angular Coding Standards',
  NGRX: 'NgRx',
  ANGULAR_MATERIAL: 'Angular Material',

  // Svelte libraries
  SVELTE_CODING_STANDARDS: 'Svelte Coding Standards',
  SVELTE_KIT: 'SvelteKit',

  // Astro libraries
  ASTRO_CODING_STANDARDS: 'Astro Coding Standards',
  ASTRO_ISLANDS: 'Astro Islands',

  // Styling libraries
  TAILWIND: 'Tailwind',
  STYLED_COMPONENTS: 'Styled Components',
  SCSS: 'SASS / SCSS',

  // Node.js libraries
  EXPRESS: 'Express',
  NEST: 'NestJS',
  FASTIFY: 'Fastify',

  // Python libraries
  DJANGO: 'Django',
  FLASK: 'Flask',
  FASTAPI: 'FastAPI',

  // Java libraries
  SPRING_BOOT: 'Spring',
  SPRING_DATA_JPA: 'Spring Data JPA',
  LOMBOK: 'Lombok',

  // .NET libraries
  ENTITY_FRAMEWORK: 'Entity Framework',
  ASP_NET: 'ASP.NET',

  // Go libraries
  GIN: 'Gin',
  ECHO: 'Echo',

  // SQL libraries
  POSTGRES: 'PostgreSQL',
  MYSQL: 'MySQL',
  SQLSERVER: 'SQL Server',

  // NoSQL libraries
  MONGODB: 'MongoDB',
  DYNAMODB: 'DynamoDB',
  FIREBASE: 'Firebase',

  // Graph libraries
  NEO4J: 'Neo4j',
  DGRAPH: 'Dgraph',

  // CI/CD libraries
  GITHUB_ACTIONS: 'GitHub Actions',
  JENKINS: 'Jenkins',
  GITLAB_CI: 'GitLab CI',

  // Containerization libraries
  DOCKER: 'Docker',
  KUBERNETES: 'Kubernetes',

  // Cloud libraries
  AWS: 'AWS',
  AZURE: 'Azure',
  GCP: 'Google Cloud',

  // Unit testing libraries
  JEST: 'Jest',
  VITEST: 'Vitest',
  MOCHA: 'Mocha',
  PYTEST: 'PyTest',

  // Integration testing libraries
  SUPERTEST: 'SuperTest',

  // E2E testing libraries
  CYPRESS: 'Cypress',
  PLAYWRIGHT: 'Playwright',
  SELENIUM: 'Selenium',

  // AI Support
  SUPPORT_BEGINNER: 'I am a beginner',
  SUPPORT_EXPERT: 'I am an expert',

  // Code Quality libraries
  ESLINT: 'ESLint',
  PRETTIER: 'Prettier',
  SONARQUBE: 'SonarQube',
  CODECOV: 'Codecov',

  // Documentation libraries
  DOC_UPDATES: 'AI Decision Log',
  STORYBOOK: 'Storybook',
  SWAGGER: 'Swagger/OpenAPI',
  TYPEDOC: 'TypeDoc',
  JSDOC: 'JSDoc',

  // Version Control libraries
  GIT: 'Git',
  GITHUB: 'GitHub',
  GITLAB: 'GitLab',
  CONVENTIONAL_COMMITS: 'Conventional Commits',

  // Architecture libraries
  ADR: 'Architecture Decision Records',
  CLEAN_ARCHITECTURE: 'Clean Architecture',
  DDD: 'Domain-Driven Design',
  MICROSERVICES: 'Microservices',
  MONOREPO: 'Monorepo',

  // Accessibility libraries
  WCAG_PERCEIVABLE: 'WCAG - Perceivable',
  WCAG_OPERABLE: 'WCAG - Operable',
  WCAG_UNDERSTANDABLE: 'WCAG - Understandable',
  WCAG_ROBUST: 'WCAG - Robust',
  ARIA: 'ARIA Best Practices',
  ACCESSIBILITY_TESTING: 'Accessibility Testing',
  MOBILE_ACCESSIBILITY: 'Mobile Accessibility',
} as const;

// Helper functions to get translations
export const getLayerTranslation = (key: keyof typeof layerTranslations): string => {
  return layerTranslations[key];
};

export const getStackTranslation = (key: keyof typeof stackTranslations): string => {
  return stackTranslations[key];
};

export const getLibraryTranslation = (key: keyof typeof libraryTranslations): string => {
  return libraryTranslations[key];
};
