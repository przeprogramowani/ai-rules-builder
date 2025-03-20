import { getLayerByStack, getStacksByLibrary, Layer, Library, Stack } from '../data/dictionaries';
import { getRulesForLibrary } from '../data/rules';
import { slugify } from '../utils/slugify.ts';

export interface RulesContent {
  markdown: string;
  label: string;
  fileName: `${string}.mdc`;
}

/**
 * Service for building AI rules based on selected libraries
 */
export class RulesBuilderService {
  /**
   * Generates markdown content for AI rules based on project metadata and selected libraries
   *
   * @param projectName - The name of the project
   * @param projectDescription - The description of the project
   * @param selectedLibraries - Array of selected libraries
   * @param multiFile - Whether to generate multiple files per each rule content
   * @returns The generated markdown content
   */
  static generateRulesContent(
    projectName: string,
    projectDescription: string,
    selectedLibraries: Library[],
    multiFile?: boolean
  ): RulesContent[] {
    // Group libraries by stack and layer
    const librariesByStack = this.groupLibrariesByStack(selectedLibraries);
    const stacksByLayer = this.groupStacksByLayer(
      Object.keys(librariesByStack) as Stack[]
    );

    const projectMarkdown = `# AI Rules for ${projectName}\n\n${projectDescription}\n\n`;
    const noSelectedLibrariesMarkdown = `---\n\n👈 Use the Rule Builder on the left or drop dependency file here`;
    const projectLabel = 'Project', projectFileName = 'project.mdc';

    /**
     * Multi-file environment
     */
    if (multiFile) {
      const markdowns: RulesContent[] = [];

      markdowns.push({ markdown: projectMarkdown, label: projectLabel, fileName: projectFileName });

      if (selectedLibraries.length === 0) {
        markdowns[0].markdown += noSelectedLibrariesMarkdown;
        return markdowns;
      }

      Object.entries(stacksByLayer).forEach(([layer, stacks]) => {
        stacks.forEach((stack) => {
          const libraries = librariesByStack[stack];
          if (libraries) {
            libraries.forEach((library) => {
              const libraryRules = getRulesForLibrary(library);
              const label = `${layer} - ${stack} - ${library}`,
                fileName: RulesContent['fileName'] = `${slugify(`${layer}-${stack}-${library}`)}.mdc`;
              const markdown = (function() {
                if (libraryRules.length > 0) {
                  return `## ${layer}\n\n### Guidelines for ${stack}\n\n#### ${library}\n\n${libraryRules.map((rule) => `- ${rule}`).join('\n')}\n\n`;
                }
                return `## ${layer}\n\n### Guidelines for ${stack}\n\n#### ${library}\n\n- Use ${library} according to best practices\n\n`;
              })();
              markdowns.push({ markdown, label, fileName });
            });
          }
        });
      });

      return markdowns;
    }

    /**
     * Single-file environment
     */
      // Generate markdown content
    let markdown = projectMarkdown;

    if (selectedLibraries.length === 0) {
      markdown += noSelectedLibrariesMarkdown;
      return [{ markdown, label: projectLabel, fileName: projectFileName }];
    }

    markdown += this.generateLibraryMarkdown(stacksByLayer, librariesByStack);
    return [{ markdown, label: 'All Rules', fileName: 'rules.mdc' }];
  }

  private static generateLibraryMarkdown(stacksByLayer: ReturnType<typeof this.groupStacksByLayer>, librariesByStack: ReturnType<typeof this.groupLibrariesByStack>): string {
    let markdown = '';

    // Generate content for each layer and its stacks
    Object.entries(stacksByLayer).forEach(([layer, stacks]) => {
      markdown += `## ${layer}\n\n`;

      stacks.forEach((stack) => {
        markdown += `### Guidelines for ${stack}\n\n`;

        const libraries = librariesByStack[stack];
        if (libraries) {
          libraries.forEach((library) => {
            markdown += `#### ${library}\n\n`;

            // Get specific rules for this library
            const libraryRules = getRulesForLibrary(library);
            if (libraryRules.length > 0) {
              libraryRules.forEach((rule) => {
                markdown += `- ${rule}\n`;
              });
            } else {
              markdown += `- Use ${library} according to best practices\n`;
            }

            markdown += '\n';
          });
        }

        markdown += '\n';
      });
    });

    return markdown;
  }

  /**
   * Groups libraries by their stack
   *
   * @param libraries - Array of libraries to group
   * @returns Record with stacks as keys and arrays of libraries as values
   */
  private static groupLibrariesByStack(
    libraries: Library[]
  ): Record<Stack, Library[]> {
    const result: Record<Stack, Library[]> = {} as Record<Stack, Library[]>;

    libraries.forEach((library) => {
      const stacks = getStacksByLibrary(library);

      stacks.forEach((stack) => {
        if (!result[stack]) {
          result[stack] = [];
        }

        if (!result[stack].includes(library)) {
          result[stack].push(library);
        }
      });
    });

    return result;
  }

  /**
   * Groups stacks by their layer
   *
   * @param stacks - Array of stacks to group
   * @returns Record with layers as keys and arrays of stacks as values
   */
  private static groupStacksByLayer(stacks: Stack[]): Record<Layer, Stack[]> {
    const result: Record<Layer, Stack[]> = {} as Record<Layer, Stack[]>;

    stacks.forEach((stack) => {
      const layer = getLayerByStack(stack);

      if (layer) {
        if (!result[layer]) {
          result[layer] = [];
        }

        if (!result[layer].includes(stack)) {
          result[layer].push(stack);
        }
      }
    });

    return result;
  }
}
