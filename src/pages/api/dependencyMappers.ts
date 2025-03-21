import { Library } from '../../data/dictionaries';

/**
 * Maps package names to Library enum values
 * This allows us to identify libraries from different dependency file formats
 */
export const packageToLibraryMap: Record<string, Library> = {
  // React ecosystem
  react: Library.REACT_CODING_STANDARDS,
  'react-router-dom': Library.REACT_ROUTER,
  redux: Library.REDUX,
  zustand: Library.ZUSTAND,
  '@tanstack/react-query': Library.REACT_QUERY,
  'react-query': Library.REACT_QUERY,

  // Vue ecosystem
  vue: Library.VUE_CODING_STANDARDS,
  'vue-router': Library.VUE_ROUTER,
  vuex: Library.VUEX,
  pinia: Library.PINIA,

  // Angular ecosystem
  '@angular/core': Library.ANGULAR_CODING_STANDARDS,
  '@ngrx/store': Library.NGRX,
  '@angular/material': Library.ANGULAR_MATERIAL,

  // Svelte ecosystem
  svelte: Library.SVELTE_CODING_STANDARDS,
  '@sveltejs/kit': Library.SVELTE_KIT,

  // Astro
  astro: Library.ASTRO_CODING_STANDARDS,

  // Node.js ecosystem
  express: Library.EXPRESS,
  '@nestjs/core': Library.NEST,
  fastify: Library.FASTIFY,

  // Python libraries (these would be in requirements.txt, not package.json)
  django: Library.DJANGO,
  flask: Library.FLASK,
  fastapi: Library.FASTAPI,

  // Database libraries
  pg: Library.POSTGRES,
  postgres: Library.POSTGRES,
  postgresql: Library.POSTGRES,
  mysql: Library.MYSQL,
  mysql2: Library.MYSQL,
  mssql: Library.SQLSERVER,
  mongodb: Library.MONGODB,
  mongoose: Library.MONGODB,
  '@aws-sdk/client-dynamodb': Library.DYNAMODB,
  firebase: Library.FIREBASE,
  'firebase-admin': Library.FIREBASE,
  'neo4j-driver': Library.NEO4J,
  'dgraph-js': Library.DGRAPH,

  // CI/CD (these would typically be in GitHub workflows, not package.json)
  'github-actions': Library.GITHUB_ACTIONS,
  jenkins: Library.JENKINS,
  'gitlab-ci': Library.GITLAB_CI,

  // Containerization (these would be in Dockerfile, not package.json)
  docker: Library.DOCKER,
  kubernetes: Library.KUBERNETES,

  // Cloud providers
  'aws-sdk': Library.AWS,
  '@aws-sdk/client-s3': Library.AWS,
  '@azure/storage-blob': Library.AZURE,
  '@google-cloud/storage': Library.GCP,

  // Testing libraries
  jest: Library.JEST,
  mocha: Library.MOCHA,
  pytest: Library.PYTEST,
  supertest: Library.SUPERTEST,
  cypress: Library.CYPRESS,
  playwright: Library.PLAYWRIGHT,
  'selenium-webdriver': Library.SELENIUM,

  // Code Quality
  eslint: Library.ESLINT,
  prettier: Library.PRETTIER,
  'sonarqube-scanner': Library.SONARQUBE,
  codecov: Library.CODECOV,

  // Documentation
  '@storybook/react': Library.STORYBOOK,
  'swagger-ui-express': Library.SWAGGER,
  typedoc: Library.TYPEDOC,
  jsdoc: Library.JSDOC,

  // Version Control (these would be in .git, not package.json)
  '@commitlint/cli': Library.CONVENTIONAL_COMMITS,
  husky: Library.CONVENTIONAL_COMMITS,

  // Architecture (these are patterns, not packages)
  'clean-architecture': Library.CLEAN_ARCHITECTURE,
  ddd: Library.DDD,
  microservices: Library.MICROSERVICES,
  nx: Library.MONOREPO,
  lerna: Library.MONOREPO,
  turborepo: Library.MONOREPO,
};

/**
 * Interface for different dependency file parsers
 */
export interface DependencyParser {
  canParse: (filename: string) => boolean;
  parse: (content: string) => string[];
}

/**
 * Parser for package.json files
 */
export const packageJsonParser: DependencyParser = {
  canParse: (filename: string) => filename.toLowerCase() === 'package.json',
  parse: (content: string) => {
    try {
      const json = JSON.parse(content);
      const dependencies = {
        ...(json.dependencies || {}),
        ...(json.devDependencies || {}),
      };
      return Object.keys(dependencies);
    } catch (error) {
      console.error('Error parsing package.json:', error);
      return [];
    }
  },
};

/**
 * Parser for requirements.txt files (Python)
 */
export const requirementsTxtParser: DependencyParser = {
  canParse: (filename: string) => filename.toLowerCase() === 'requirements.txt',
  parse: (content: string) => {
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
  },
};

/**
 * List of available parsers
 */
export const dependencyParsers: DependencyParser[] = [
  packageJsonParser,
  requirementsTxtParser,
];

/**
 * Maps dependencies to libraries
 * @param dependencies Array of dependency names
 * @returns Array of Library enum values
 */
export function mapDependenciesToLibraries(dependencies: string[]): Library[] {
  // Map dependencies to libraries
  const identifiedLibraries = dependencies
    .map((dep) => {
      // For package.json, extract the package name without scope
      const packageName = dep.startsWith('@')
        ? dep.split('/').slice(0, 2).join('/')
        : dep.split('/')[0];

      return packageToLibraryMap[packageName];
    })
    .filter(Boolean) as Library[];

  // Remove duplicates
  return [...new Set(identifiedLibraries)];
}
