import { Library } from '../dictionaries';
import { type LibraryRulesMap } from './types';

/**
 * Get rules for a specific library
 * @param rulesMap The rules map to get rules from
 * @param library The library to get rules for
 * @returns Array of rules for the library
 */
export const getRulesForLibrary = (
  rulesMap: LibraryRulesMap,
  library: Library,
): string[] => {
  return rulesMap[library] || [];
};

/**
 * Get rules for multiple libraries
 * @param rulesMap The rules map to get rules from
 * @param libraries Array of libraries to get rules for
 * @returns Record with libraries as keys and arrays of rules as values
 */
export const getRulesForLibraries = (
  rulesMap: LibraryRulesMap,
  libraries: Library[],
): Partial<Record<Library, string[]>> => {
  const result: Partial<Record<Library, string[]>> = {};

  libraries.forEach((library) => {
    if (rulesMap[library]) {
      result[library] = getRulesForLibrary(rulesMap, library);
    }
  });

  return result;
};
