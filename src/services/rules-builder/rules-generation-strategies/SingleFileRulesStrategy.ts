import type { RulesGenerationStrategy } from '../RulesGenerationStrategy.ts';
import { Layer, Library, Stack } from '../../../data/dictionaries.ts';
import type { RulesContent } from '../RulesBuilderTypes.ts';
import { getRulesForLibrary } from '../../../data/rules.ts';

/**
 * Strategy for single-file rules generation
 */
export class SingleFileRulesStrategy implements RulesGenerationStrategy {
  generateRules(
    projectName: string,
    projectDescription: string,
    selectedLibraries: Library[],
    stacksByLayer: Record<Layer, Stack[]>,
    librariesByStack: Record<Stack, Library[]>,
  ): RulesContent[] {
    const projectMarkdown = `# AI Rules for ${projectName}\n\n${projectDescription}\n\n`;
    const noSelectedLibrariesMarkdown = `---\n\n👈 Use the Rule Builder on the left or drop dependency file here`;
    const projectLabel = 'Project',
      projectFileName = 'project.mdc';

    let markdown = projectMarkdown;

    if (selectedLibraries.length === 0) {
      markdown += noSelectedLibrariesMarkdown;
      return [{ markdown, label: projectLabel, fileName: projectFileName }];
    }

    markdown += this.generateLibraryMarkdown(stacksByLayer, librariesByStack);
    return [{ markdown, label: 'All Rules', fileName: 'rules.mdc' }];
  }

  private generateLibraryMarkdown(
    stacksByLayer: Record<Layer, Stack[]>,
    librariesByStack: Record<Stack, Library[]>,
  ): string {
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
}
