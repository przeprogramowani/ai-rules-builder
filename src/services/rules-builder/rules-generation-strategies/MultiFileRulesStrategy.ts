import type { RulesGenerationStrategy } from '../RulesGenerationStrategy.ts';
import { Layer, type Library, Stack } from '../../../data/dictionaries.ts';
import type { RulesContent } from '../RulesBuilderTypes.ts';
import { getRulesForLibrary } from '../../../data/rules';
import { slugify } from '../../../utils/slugify.ts';

/**
 * Strategy for multi-file rules generation
 */
export class MultiFileRulesStrategy implements RulesGenerationStrategy {
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
            const markdown = (function () {
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
}
