import preparedRulesData from '../preparedRules.json';
// Import type from the tools directory
import type { HierarchyNode } from '../tools/rulesTools';

interface PreparedRules {
  hierarchy: HierarchyNode[];
  rules: Record<string, string[]>;
}

// Type assertion for JSON import.
// Ensure 'resolveJsonModule' is true in your tsconfig.json
const preparedRules = preparedRulesData as PreparedRules;

/**
 * Returns the hierarchical structure of available rules.
 */
export function getRuleHierarchy(): HierarchyNode[] {
  // Add basic check in case the json is malformed or empty
  if (!preparedRules || !preparedRules.hierarchy) {
      console.error('Error: preparedRules.json missing or hierarchy property not found.');
      return [];
  }
  return preparedRules.hierarchy;
}

/**
 * Returns the rules for a specific library identifier.
 * @param libraryIdentifier The unique identifier for the library (e.g., 'REACT', 'NEXT_JS').
 * @returns An array of rules strings, or undefined if the library identifier is not found.
 */
export function getRulesForLibrary(libraryIdentifier: string): string[] | undefined {
   // Add basic check
  if (!preparedRules || !preparedRules.rules) {
      console.error('Error: preparedRules.json missing or rules property not found.');
      return undefined;
  }
  return preparedRules.rules[libraryIdentifier];
}