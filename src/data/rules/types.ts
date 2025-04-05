import { Library } from '../dictionaries';

/**
 * Type definition for library rules
 * Using Partial to allow each module to contain only a subset of libraries
 */
export type LibraryRulesMap = Partial<Record<Library, string[]>>;
