import type { RulesGenerationStrategy } from '../RulesGenerationStrategy.ts';
import { Layer, type Library, Stack } from '../../../data/dictionaries.ts';
import type { RulesContent } from '../RulesBuilderTypes.ts';
import { slugify } from '../../../utils/slugify.ts';
import {
  createProjectMarkdown,
  createEmptyStateMarkdown,
  generateLibraryContent,
  renderLibrarySection,
  PROJECT_FILE_CONFIG,
} from './shared/rulesMarkdownBuilders.ts';

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
    const projectMarkdown = createProjectMarkdown(projectName, projectDescription);
    const markdowns: RulesContent[] = [];

    markdowns.push({
      markdown: projectMarkdown,
      label: PROJECT_FILE_CONFIG.label,
      fileName: PROJECT_FILE_CONFIG.fileName,
    });

    if (selectedLibraries.length === 0) {
      markdowns[0].markdown += createEmptyStateMarkdown();
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
            }),
          );
        });
      });
    });

    return markdowns;
  }

  private buildRulesContent({
    layer,
    stack,
    library,
  }: {
    layer: string;
    stack: string;
    library: string;
  }): RulesContent {
    const label = `${layer} - ${stack} - ${library}`;
    const fileName: RulesContent['fileName'] = `${slugify(`${layer}-${stack}-${library}`)}.mdc`;
    const content = generateLibraryContent(library as Library);
    const markdown = renderLibrarySection({ layer, stack, library, content });
    return { markdown, label, fileName };
  }
}
