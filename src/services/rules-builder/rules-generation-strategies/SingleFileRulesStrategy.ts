import type { RulesGenerationStrategy } from '../RulesGenerationStrategy.ts';
import { Layer, Library, Stack } from '../../../data/dictionaries.ts';
import type { RulesContent } from '../RulesBuilderTypes.ts';
import {
  createProjectMarkdown,
  createEmptyStateMarkdown,
  generateLibrarySections,
  PROJECT_FILE_CONFIG,
} from './shared/rulesMarkdownBuilders.ts';

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
    let markdown = createProjectMarkdown(projectName, projectDescription);

    if (selectedLibraries.length === 0) {
      markdown += createEmptyStateMarkdown();
      return [
        {
          markdown,
          label: PROJECT_FILE_CONFIG.label,
          fileName: PROJECT_FILE_CONFIG.fileName,
        },
      ];
    }

    markdown += generateLibrarySections(stacksByLayer, librariesByStack);
    return [{ markdown, label: 'All Rules', fileName: 'rules.mdc' }];
  }
}
