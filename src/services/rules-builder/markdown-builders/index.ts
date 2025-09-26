import type { Layer, Library, Stack } from '../../../data/dictionaries.ts';
import { getRulesForLibrary } from '../../../data/rules.ts';
import { slugify } from '../../../utils/slugify.ts';

export const createProjectMarkdown = (projectName: string, projectDescription: string): string =>
  `# AI Rules for ${projectName}\n\n${projectDescription}\n\n`;

export const createEmptyStateMarkdown = (): string =>
  `---\n\n👈 Use the Rule Builder on the left or drop dependency file here`;

export const getProjectMetadata = () => ({
  label: 'Project',
  fileName: 'project.mdc' as const,
});

export interface LibrarySectionConfig {
  layer: string;
  stack: string;
  library: string;
  includeLayerHeader?: boolean;
  includeStackHeader?: boolean;
}

export const renderLibrarySection = ({
  layer,
  stack,
  library,
  includeLayerHeader = false,
  includeStackHeader = false,
}: LibrarySectionConfig): string => {
  let markdown = '';

  if (includeLayerHeader) {
    markdown += `## ${layer}\n\n`;
  }

  if (includeStackHeader) {
    markdown += `### Guidelines for ${stack}\n\n`;
  }

  markdown += `#### ${library}\n\n`;

  const libraryRules = getRulesForLibrary(library);
  if (libraryRules.length > 0) {
    libraryRules.forEach((rule) => {
      markdown += `- ${rule}\n`;
    });
  } else {
    markdown += `- Use ${library} according to best practices\n`;
  }

  markdown += '\n';

  return markdown;
};

export const renderLibraryRulesContent = (library: Library): string => {
  const libraryRules = getRulesForLibrary(library);
  return libraryRules.length > 0
    ? libraryRules.map((rule) => `- ${rule}`).join('\n')
    : `- Use ${library} according to best practices`;
};

export interface LayerStackIterator {
  stacksByLayer: Record<Layer, Stack[]>;
  librariesByStack: Record<Stack, Library[]>;
  onLibrary: (
    layer: Layer,
    stack: Stack,
    library: Library,
    isFirstInStack: boolean,
    isFirstInLayer: boolean,
  ) => void;
}

export const iterateLayersStacksLibraries = ({
  stacksByLayer,
  librariesByStack,
  onLibrary,
}: LayerStackIterator): void => {
  Object.entries(stacksByLayer).forEach(([layer, stacks], layerIndex) => {
    stacks.forEach((stack, stackIndex) => {
      const libraries = librariesByStack[stack];
      if (libraries) {
        libraries.forEach((library, libraryIndex) => {
          onLibrary(
            layer as Layer,
            stack,
            library,
            libraryIndex === 0,
            layerIndex === 0 && stackIndex === 0,
          );
        });
      }
    });
  });
};

export const createLibraryFileMetadata = (layer: string, stack: string, library: string) => ({
  label: `${layer} - ${stack} - ${library}`,
  fileName: `${slugify(`${layer}-${stack}-${library}`)}.mdc` as const,
});
