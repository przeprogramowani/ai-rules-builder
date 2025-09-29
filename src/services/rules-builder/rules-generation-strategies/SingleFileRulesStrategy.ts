import type { RulesGenerationStrategy } from '../RulesGenerationStrategy.ts';
import { Layer, Library, Stack } from '../../../data/dictionaries.ts';
import type { RulesContent } from '../RulesBuilderTypes.ts';
import {
  createProjectMarkdown,
  createEmptyStateMarkdown,
  getProjectMetadata,
  renderLibrarySection,
  iterateLayersStacksLibraries,
} from '../markdown-builders/index.ts';

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
    const projectMarkdown = createProjectMarkdown(projectName, projectDescription);
    const { label: projectLabel, fileName: projectFileName } = getProjectMetadata();

    let markdown = projectMarkdown;

    if (selectedLibraries.length === 0) {
      markdown += createEmptyStateMarkdown();
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
    let currentLayer = '';
    let currentStack = '';

    iterateLayersStacksLibraries({
      stacksByLayer,
      librariesByStack,
      onLibrary: (layer, stack, library) => {
        const includeLayerHeader = layer !== currentLayer;
        const includeStackHeader = stack !== currentStack;

        if (includeLayerHeader) {
          currentLayer = layer;
        }
        if (includeStackHeader) {
          currentStack = stack;
          if (!includeLayerHeader && currentStack) {
            markdown += '\n';
          }
        }

        markdown += renderLibrarySection({
          layer,
          stack,
          library,
          includeLayerHeader,
          includeStackHeader,
        });
      },
    });

    return markdown;
  }
}
