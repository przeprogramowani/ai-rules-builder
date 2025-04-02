/**
 * Dictionaries for 10xRules.ai
 *
 * This file defines the relationships between layers, stacks, and libraries
 * - Layers contain stacks
 * - Stacks contain libraries
 */

// Define enums for each level
export enum Layer {
  CODING_PRACTICES = 'CODING_PRACTICES',
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  DATABASE = 'DATABASE',
  DEVOPS = 'DEVOPS',
  TESTING = 'TESTING',
}

export enum Stack {
  // Frontend stacks
  REACT = 'REACT',
  VUE = 'VUE',
  ANGULAR = 'ANGULAR',
  SVELTE = 'SVELTE',
  ASTRO = 'ASTRO',
  STYLING = 'STYLING',

  // Backend stacks
  NODE = 'NODE',
  PYTHON = 'PYTHON',
  JAVA = 'JAVA',
  DOTNET = 'DOTNET',
  GO = 'GO',

  // Database stacks
  SQL = 'SQL',
  NOSQL = 'NOSQL',
  GRAPH = 'GRAPH',

  // DevOps stacks
  CI_CD = 'CI_CD',
  CONTAINERIZATION = 'CONTAINERIZATION',
  CLOUD = 'CLOUD',

  // Testing stacks
  UNIT = 'UNIT',
  INTEGRATION = 'INTEGRATION',
  E2E = 'E2E',

  // Coding practices
  SUPPORT_LEVEL = 'SUPPORT_LEVEL',
  VERSION_CONTROL = 'VERSION_CONTROL',
  DOCUMENTATION = 'DOCUMENTATION',
  ARCHITECTURE = 'ARCHITECTURE',
  STATIC_ANALYSIS = 'STATIC_ANALYSIS',
  ACCESSIBILITY = 'ACCESSIBILITY',
}

export enum Library {
  // React libraries
  REACT_CODING_STANDARDS = 'REACT_CODING_STANDARDS',
  NEXT_JS = 'NEXT_JS',
  REACT_ROUTER = 'REACT_ROUTER',
  REDUX = 'REDUX',
  ZUSTAND = 'ZUSTAND',
  REACT_QUERY = 'REACT_QUERY',

  // Vue libraries
  VUE_CODING_STANDARDS = 'VUE_CODING_STANDARDS',
  NUXT = 'NUXT',
  VUEX = 'VUEX',
  VUE_ROUTER = 'VUE_ROUTER',
  PINIA = 'PINIA',

  // Angular libraries
  ANGULAR_CODING_STANDARDS = 'ANGULAR_CODING_STANDARDS',
  NGRX = 'NGRX',
  ANGULAR_MATERIAL = 'ANGULAR_MATERIAL',

  // Svelte libraries
  SVELTE_CODING_STANDARDS = 'SVELTE_CODING_STANDARDS',
  SVELTE_KIT = 'SVELTE_KIT',

  // Astro libraries
  ASTRO_CODING_STANDARDS = 'ASTRO_CODING_STANDARDS',
  ASTRO_ISLANDS = 'ASTRO_ISLANDS',

  // Styling libraries
  TAILWIND = 'TAILWIND',
  STYLED_COMPONENTS = 'STYLED_COMPONENTS',
  SCSS = 'SCSS',

  // Node.js libraries
  EXPRESS = 'EXPRESS',
  NEST = 'NEST',
  FASTIFY = 'FASTIFY',

  // Python libraries
  DJANGO = 'DJANGO',
  FLASK = 'FLASK',
  FASTAPI = 'FASTAPI',

  // Java libraries
  SPRING_BOOT = 'SPRING_BOOT',
  SPRING_DATA_JPA = 'SPRING_DATA_JPA',
  LOMBOK = 'LOMBOK',

  // .NET libraries
  ENTITY_FRAMEWORK = 'ENTITY_FRAMEWORK',
  ASP_NET = 'ASP_NET',

  // Go libraries
  GIN = 'GIN',
  ECHO = 'ECHO',

  // SQL libraries
  POSTGRES = 'POSTGRES',
  MYSQL = 'MYSQL',
  SQLSERVER = 'SQLSERVER',

  // NoSQL libraries
  MONGODB = 'MONGODB',
  DYNAMODB = 'DYNAMODB',
  FIREBASE = 'FIREBASE',

  // Graph libraries
  NEO4J = 'NEO4J',
  DGRAPH = 'DGRAPH',

  // CI/CD libraries
  GITHUB_ACTIONS = 'GITHUB_ACTIONS',
  JENKINS = 'JENKINS',
  GITLAB_CI = 'GITLAB_CI',

  // Containerization libraries
  DOCKER = 'DOCKER',
  KUBERNETES = 'KUBERNETES',

  // Cloud libraries
  AWS = 'AWS',
  AZURE = 'AZURE',
  GCP = 'GCP',

  // Unit testing libraries
  JEST = 'JEST',
  VITEST = 'VITEST',
  MOCHA = 'MOCHA',
  PYTEST = 'PYTEST',

  // Integration testing libraries
  SUPERTEST = 'SUPERTEST',

  // E2E testing libraries
  CYPRESS = 'CYPRESS',
  PLAYWRIGHT = 'PLAYWRIGHT',
  SELENIUM = 'SELENIUM',

  // AI Support
  SUPPORT_BEGINNER = 'SUPPORT_BEGINNER',
  SUPPORT_EXPERT = 'SUPPORT_EXPERT',

  // Code Quality libraries
  ESLINT = 'ESLINT',
  PRETTIER = 'PRETTIER',
  SONARQUBE = 'SONARQUBE',
  CODECOV = 'CODECOV',

  // Documentation libraries
  DOC_UPDATES = 'DOC_UPDATES',
  STORYBOOK = 'STORYBOOK',
  SWAGGER = 'SWAGGER',
  TYPEDOC = 'TYPEDOC',
  JSDOC = 'JSDOC',

  // Version Control libraries
  GIT = 'GIT',
  GITHUB = 'GITHUB',
  GITLAB = 'GITLAB',
  CONVENTIONAL_COMMITS = 'CONVENTIONAL_COMMITS',

  // Architecture libraries
  ADR = 'ADR',
  CLEAN_ARCHITECTURE = 'CLEAN_ARCHITECTURE',
  DDD = 'DDD',
  MICROSERVICES = 'MICROSERVICES',
  MONOREPO = 'MONOREPO',

  // Accessibility libraries
  WCAG_PERCEIVABLE = 'WCAG_PERCEIVABLE',
  WCAG_OPERABLE = 'WCAG_OPERABLE',
  WCAG_UNDERSTANDABLE = 'WCAG_UNDERSTANDABLE',
  WCAG_ROBUST = 'WCAG_ROBUST',
  ARIA = 'ARIA',
  ACCESSIBILITY_TESTING = 'ACCESSIBILITY_TESTING',
  MOBILE_ACCESSIBILITY = 'MOBILE_ACCESSIBILITY',
}

// Define relationships between layers, stacks, and libraries
export interface LayerToStackMap {
  [key: string]: Stack[];
}

export interface StackToLibraryMap {
  [key: string]: Library[];
}

// Map layers to stacks
export const layerToStackMap: LayerToStackMap = {
  [Layer.CODING_PRACTICES]: [
    Stack.SUPPORT_LEVEL,
    Stack.DOCUMENTATION,
    Stack.VERSION_CONTROL,
    Stack.ARCHITECTURE,
    Stack.STATIC_ANALYSIS,
  ],
  [Layer.FRONTEND]: [
    Stack.REACT,
    Stack.VUE,
    Stack.ANGULAR,
    Stack.SVELTE,
    Stack.ASTRO,
    Stack.STYLING,
    Stack.ACCESSIBILITY,
  ],
  [Layer.BACKEND]: [Stack.NODE, Stack.PYTHON, Stack.JAVA, Stack.DOTNET, Stack.GO],
  [Layer.DATABASE]: [Stack.SQL, Stack.NOSQL, Stack.GRAPH],
  [Layer.DEVOPS]: [Stack.CI_CD, Stack.CONTAINERIZATION, Stack.CLOUD],
  [Layer.TESTING]: [Stack.UNIT, Stack.INTEGRATION, Stack.E2E],
};

// Map stacks to libraries
export const stackToLibraryMap: StackToLibraryMap = {
  [Stack.REACT]: [
    Library.REACT_CODING_STANDARDS,
    Library.NEXT_JS,
    Library.REACT_ROUTER,
    Library.REDUX,
    Library.ZUSTAND,
    Library.REACT_QUERY,
  ],
  [Stack.VUE]: [
    Library.VUE_CODING_STANDARDS,
    Library.NUXT,
    Library.VUEX,
    Library.VUE_ROUTER,
    Library.PINIA,
  ],
  [Stack.ANGULAR]: [Library.ANGULAR_CODING_STANDARDS, Library.NGRX, Library.ANGULAR_MATERIAL],
  [Stack.SVELTE]: [Library.SVELTE_CODING_STANDARDS, Library.SVELTE_KIT],
  [Stack.ASTRO]: [Library.ASTRO_CODING_STANDARDS, Library.ASTRO_ISLANDS],
  [Stack.STYLING]: [Library.TAILWIND, Library.STYLED_COMPONENTS, Library.SCSS],
  [Stack.NODE]: [Library.EXPRESS, Library.NEST, Library.FASTIFY],
  [Stack.PYTHON]: [Library.DJANGO, Library.FLASK, Library.FASTAPI],
  [Stack.JAVA]: [Library.SPRING_BOOT, Library.SPRING_DATA_JPA, Library.LOMBOK],
  [Stack.DOTNET]: [Library.ENTITY_FRAMEWORK, Library.ASP_NET],
  [Stack.GO]: [Library.GIN, Library.ECHO],
  [Stack.SQL]: [Library.POSTGRES, Library.MYSQL, Library.SQLSERVER],
  [Stack.NOSQL]: [Library.MONGODB, Library.DYNAMODB, Library.FIREBASE],
  [Stack.GRAPH]: [Library.NEO4J, Library.DGRAPH],
  [Stack.CI_CD]: [Library.GITHUB_ACTIONS, Library.JENKINS, Library.GITLAB_CI],
  [Stack.CONTAINERIZATION]: [Library.DOCKER, Library.KUBERNETES],
  [Stack.CLOUD]: [Library.AWS, Library.AZURE, Library.GCP],
  [Stack.UNIT]: [Library.JEST, Library.VITEST, Library.MOCHA, Library.PYTEST],
  [Stack.INTEGRATION]: [Library.SUPERTEST],
  [Stack.E2E]: [Library.CYPRESS, Library.PLAYWRIGHT, Library.SELENIUM],
  [Stack.SUPPORT_LEVEL]: [Library.SUPPORT_BEGINNER, Library.SUPPORT_EXPERT],
  [Stack.STATIC_ANALYSIS]: [Library.ESLINT, Library.PRETTIER, Library.SONARQUBE, Library.CODECOV],
  [Stack.DOCUMENTATION]: [
    Library.DOC_UPDATES,
    Library.JSDOC,
    Library.TYPEDOC,
    Library.STORYBOOK,
    Library.SWAGGER,
  ],
  [Stack.VERSION_CONTROL]: [
    Library.GIT,
    Library.GITHUB,
    Library.GITLAB,
    Library.CONVENTIONAL_COMMITS,
  ],
  [Stack.ARCHITECTURE]: [
    Library.ADR,
    Library.CLEAN_ARCHITECTURE,
    Library.DDD,
    Library.MICROSERVICES,
    Library.MONOREPO,
  ],
  [Stack.ACCESSIBILITY]: [
    Library.WCAG_PERCEIVABLE,
    Library.WCAG_OPERABLE,
    Library.WCAG_UNDERSTANDABLE,
    Library.WCAG_ROBUST,
    Library.ARIA,
    Library.ACCESSIBILITY_TESTING,
    Library.MOBILE_ACCESSIBILITY,
  ],
};

// Helper functions to get relationships
export const getStacksByLayer = (layer: Layer): Stack[] => {
  return layerToStackMap[layer] || [];
};

export const getLibrariesByStack = (stack: Stack): Library[] => {
  return stackToLibraryMap[stack] || [];
};

export const getLayerByStack = (stack: Stack): Layer | undefined => {
  for (const [layer, stacks] of Object.entries(layerToStackMap)) {
    if (stacks.includes(stack)) {
      return layer as Layer;
    }
  }
  return undefined;
};

export const getStacksByLibrary = (library: Library): Stack[] => {
  const stacks: Stack[] = [];
  for (const [stack, libraries] of Object.entries(stackToLibraryMap)) {
    if (libraries.includes(library)) {
      stacks.push(stack as Stack);
    }
  }
  return stacks;
};

export const getLayersByLibrary = (library: Library): Layer[] => {
  const stacks = getStacksByLibrary(library);
  const layers = new Set<Layer>();

  stacks.forEach((stack) => {
    const layer = getLayerByStack(stack);
    if (layer) {
      layers.add(layer);
    }
  });

  return Array.from(layers);
};

// Helper function to get the total count of libraries in a layer
export const getLibrariesCountByLayer = (layer: Layer): number => {
  const stacks = getStacksByLayer(layer);
  let totalLibraries = 0;

  stacks.forEach((stack) => {
    totalLibraries += getLibrariesByStack(stack).length;
  });

  return totalLibraries;
};
