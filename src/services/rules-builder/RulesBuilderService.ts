import { Layer, Library, Stack, getLayerByStack, getStacksByLibrary } from '../../data/dictionaries.ts';
import type { RulesContent } from './RulesBuilderTypes.ts';
import type { RulesGenerationStrategy } from './RulesGenerationStrategy.ts';
import { MultiFileRulesStrategy } from './rules-generation-strategies/MultiFileRulesStrategy.ts';
import { SingleFileRulesStrategy } from './rules-generation-strategies/SingleFileRulesStrategy.ts';

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
    multiFile?: boolean,
  ): RulesContent[] {
    // Group libraries by stack and layer
    const librariesByStack = this.groupLibrariesByStack(selectedLibraries);
    const stacksByLayer = this.groupStacksByLayer(Object.keys(librariesByStack) as Stack[]);

    const strategy: RulesGenerationStrategy = multiFile ? new MultiFileRulesStrategy() : new SingleFileRulesStrategy();

    return strategy.generateRules(projectName, projectDescription, selectedLibraries, stacksByLayer, librariesByStack);
  }

  /**
   * Groups libraries by their stack
   *
   * @param libraries - Array of libraries to group
   * @returns Record with stacks as keys and arrays of libraries as values
   */
  private static groupLibrariesByStack(libraries: Library[]): Record<Stack, Library[]> {
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
