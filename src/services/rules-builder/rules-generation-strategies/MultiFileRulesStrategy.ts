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
        librariesByStack[stack].forEach((library) => {
          markdowns.push(
            this.buildRulesContent({
              layer,
              stack,
              library,
              libraryRules: getRulesForLibrary(library),
            }),
          );
        });
      });
    });

    return markdowns;
  }

  private buildRulesContent({
    libraryRules,
    layer,
    stack,
    library,
  }: {
    libraryRules: string[];
    layer: string;
    stack: string;
    library: string;
  }): RulesContent {
    const label = `${layer} - ${stack} - ${library}`;
    const fileName: RulesContent['fileName'] = `${slugify(`${layer}-${stack}-${library}`)}.mdc`;
    const content =
      libraryRules.length > 0
        ? `${libraryRules.map((rule) => `- ${rule}`).join('\n')}`
        : `- Use ${library} according to best practices`;
    const markdown = this.renderRuleMarkdown({ content, layer, stack, library });
    return { markdown, label, fileName };
  }

  private renderRuleMarkdown = ({
    content,
    layer,
    stack,
    library,
  }: {
    content: string;
    layer: string;
    stack: string;
    library: string;
  }) =>
    `## ${layer}\n\n### Guidelines for ${stack}\n\n#### ${library}\n\n{{content}}\n\n`.replace(
      '{{content}}',
      content,
    );
}
