import { Library } from './dictionaries';
import {
  frontendRules,
  backendRules,
  databaseRules,
  infrastructureRules,
  testingRules,
  codingRules,
  accessibilityRules,
  getRulesForLibrary as getLibraryRules,
  getRulesForLibraries as getLibrariesRules,
} from './rules/index';

/**
 * Combined library rules from all categories
 * Cast to Record<Library, string[]> to ensure all libraries are covered
 */
export const libraryRules: Record<Library, string[]> = {
  ...frontendRules,
  ...backendRules,
  ...databaseRules,
  ...infrastructureRules,
  ...testingRules,
  ...codingRules,
  ...accessibilityRules,
} as Record<Library, string[]>;

/**
 * Get rules for a specific library
 * @param library The library to get rules for
 * @returns Array of rules for the library
 */
export const getRulesForLibrary = (library: Library): string[] => {
  return getLibraryRules(libraryRules, library);
};

/**
 * Get rules for multiple libraries
 * @param libraries Array of libraries to get rules for
 * @returns Record with libraries as keys and arrays of rules as values
 */
export const getRulesForLibraries = (
  libraries: Library[],
): Record<Library, string[]> => {
  // Convert the partial record to a full record by filtering only requested libraries
  const partialResult = getLibrariesRules(libraryRules, libraries);

  // Create a new record with only the requested libraries
  const result: Record<Library, string[]> = {} as Record<Library, string[]>;

  // Only include libraries that were requested
  libraries.forEach((library) => {
    result[library] = partialResult[library] || [];
  });

  return result;
};
