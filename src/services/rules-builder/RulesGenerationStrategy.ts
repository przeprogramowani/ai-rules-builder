import { Layer, Library, Stack } from '../../data/dictionaries.ts';
import type { RulesContent } from './RulesBuilderTypes.ts';

/**
 * Strategy interface for rules generation
 */
export interface RulesGenerationStrategy {
  generateRules(
    projectName: string,
    projectDescription: string,
    selectedLibraries: Library[],
    stacksByLayer: Record<Layer, Stack[]>,
    librariesByStack: Record<Stack, Library[]>,
  ): RulesContent[];
}
