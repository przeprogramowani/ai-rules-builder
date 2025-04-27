import { z } from 'zod';
import { getRuleHierarchy, getRulesForLibrary } from '../data/rulesProvider';

// Define recursive schema for the hierarchy structure
export interface HierarchyNode {
  id: string;
  name: string;
  children?: HierarchyNode[];
}

const hierarchyNodeSchema: z.ZodType<HierarchyNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    children: z.array(hierarchyNodeSchema).optional(),
  })
);

// New schema for the listAvailableRulesTool output
const libraryInfoSchema = z.object({
  identifier: z.string(),
  name: z.string(),
  stack: z.array(z.string()), // e.g., ["Frontend", "React"]
});

const listAvailableRulesOutputSchema = z.object({
    availableLibraries: z.array(libraryInfoSchema),
    reminder: z.string(),
});

const getRuleContentInputSchema = z.object({ libraryIdentifier: z.string() });
const getRuleContentOutputSchema = z.union([
  z.object({ rules: z.array(z.string()) }),
  z.object({ error: z.string() }),
]);

// Helper function to find leaf nodes (libraries)
type LibraryInfo = z.infer<typeof libraryInfoSchema>;

function findLibraries(nodes: HierarchyNode[], currentStack: string[] = []): LibraryInfo[] {
  let libraries: LibraryInfo[] = [];
  if (!nodes) return libraries;

  nodes.forEach(node => {
    const newStack = [...currentStack, node.name];
    if (!node.children || node.children.length === 0) {
      // This is a leaf node (a library)
      // We only add it if it seems like a rule identifier (heuristic: contains '_')
      // or if it's explicitly marked somehow (adjust logic if needed based on preparedRules.json structure)
      // For now, let's assume all leaf nodes with actual rules in preparedRules.json are valid identifiers.
      // A better approach might be to cross-reference with preparedRules.rules keys if necessary.
      libraries.push({
        identifier: node.id,
        name: node.name,
        stack: currentStack, // Stack leading *to* this node's parent category
      });
    } else {
      // Recurse into children
      libraries = libraries.concat(findLibraries(node.children, newStack));
    }
  });
  return libraries;
}

// Updated listAvailableRulesTool
export const listAvailableRulesTool = {
  name: 'listAvailableRules',
  description: 'Lists available AI library identifiers and their stacks, with instructions on how to get rules.',
  inputSchema: z.object({}).optional(),
  outputSchema: listAvailableRulesOutputSchema, // Use the new output schema
  async execute(): Promise<z.infer<typeof listAvailableRulesOutputSchema>> {
    const hierarchy = getRuleHierarchy();
    const availableLibraries = findLibraries(hierarchy);

    const result = {
        availableLibraries: availableLibraries,
        reminder: "Use the 'getRuleContent' tool with one of the 'identifier' values (e.g., 'REACT_CODING_STANDARDS') to get specific rules."
    };

    // Validate the final output structure
    const validation = listAvailableRulesOutputSchema.safeParse(result);
    if (!validation.success) {
        console.error('Output validation failed for listAvailableRules:', validation.error);
        // Fallback or throw error
        throw new Error('Internal server error: Failed to prepare available libraries list.');
    }
    return validation.data;
  },
};

export const getRuleContentTool = {
  name: 'getRuleContent',
  description: 'Gets the AI rules for a specific library identifier.',
  inputSchema: getRuleContentInputSchema,
  outputSchema: getRuleContentOutputSchema,
  async execute(input: z.infer<typeof getRuleContentInputSchema>): Promise<z.infer<typeof getRuleContentOutputSchema>> {
    const rules = getRulesForLibrary(input.libraryIdentifier);
    let result: z.infer<typeof getRuleContentOutputSchema>;
    if (rules) {
      result = { rules };
    } else {
      result = { error: `Rules not found for library identifier: ${input.libraryIdentifier}. Please check the identifier and try again. You can use the 'listAvailableRules' tool to get a list of available libraries. Identifier format is: 'LIBRARY_NAME_RULE_NAME'` };
    }
    // Validate output before returning
    const validation = getRuleContentOutputSchema.safeParse(result);
     if (!validation.success) {
        console.error(`Output validation failed for getRuleContent (input: ${input.libraryIdentifier}):`, validation.error);
        // Even if rules were found, if they don't match schema, it's an internal error
        throw new Error('Internal server error: Failed to prepare rule content.');
    }
    return validation.data;
  },
};

// Export all tools in a map for easy lookup
export const tools = {
  [listAvailableRulesTool.name]: listAvailableRulesTool,
  [getRuleContentTool.name]: getRuleContentTool,
};

export type Tool = typeof listAvailableRulesTool | typeof getRuleContentTool;
export type ToolName = keyof typeof tools;