import type { RulesGenerationStrategy } from '../RulesGenerationStrategy.ts';
import { Layer, type Library, Stack } from '../../../data/dictionaries.ts';
import type { RulesContent } from '../RulesBuilderTypes.ts';
import {
  createProjectMarkdown,
  createEmptyStateMarkdown,
  getProjectMetadata,
  renderLibrarySection,
  iterateLayersStacksLibraries,
  createLibraryFileMetadata,
} from '../markdown-builders/index.ts';

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
    const { label: projectLabel, fileName: projectFileName } = getProjectMetadata();

    const markdowns: RulesContent[] = [];

    markdowns.push({ markdown: projectMarkdown, label: projectLabel, fileName: projectFileName });

    if (selectedLibraries.length === 0) {
      markdowns[0].markdown += createEmptyStateMarkdown();
      return markdowns;
    }

    iterateLayersStacksLibraries({
      stacksByLayer,
      librariesByStack,
      onLibrary: (layer, stack, library) => {
        markdowns.push(this.buildRulesContent({ layer, stack, library }));
      },
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
    const { label, fileName } = createLibraryFileMetadata(layer, stack, library);
    const markdown = renderLibrarySection({
      layer,
      stack,
      library,
      includeLayerHeader: true,
      includeStackHeader: true,
    });
    return { markdown, label, fileName };
  }
}
