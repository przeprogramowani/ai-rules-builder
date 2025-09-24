import type { Layer, Library, Stack } from '../../../../data/dictionaries.ts';
import { getRulesForLibrary } from '../../../../data/rules.ts';

/**
 * Creates the project header markdown
 */
export function createProjectMarkdown(projectName: string, projectDescription: string): string {
  return `# AI Rules for ${projectName}\n\n${projectDescription}\n\n`;
}

/**
 * Creates the empty state markdown
 */
export function createEmptyStateMarkdown(): string {
  return `---\n\n👈 Use the Rule Builder on the left or drop dependency file here`;
}

/**
 * Generates markdown for a single library
 */
export function generateLibraryContent(library: Library): string {
  const libraryRules = getRulesForLibrary(library);

  if (libraryRules.length > 0) {
    return libraryRules.map((rule) => `- ${rule}`).join('\n');
  }

  return `- Use ${library} according to best practices`;
}

/**
 * Renders a complete library section with headers
 */
export function renderLibrarySection({
  layer,
  stack,
  library,
  content,
}: {
  layer: string;
  stack: string;
  library: string;
  content?: string;
}): string {
  const finalContent = content ?? generateLibraryContent(library as Library);

  return `## ${layer}\n\n### Guidelines for ${stack}\n\n#### ${library}\n\n${finalContent}\n\n`;
}

/**
 * Generates markdown for all libraries organized by layer and stack
 */
export function generateLibrarySections(
  stacksByLayer: Record<Layer, Stack[]>,
  librariesByStack: Record<Stack, Library[]>,
): string {
  let markdown = '';

  Object.entries(stacksByLayer).forEach(([layer, stacks]) => {
    markdown += `## ${layer}\n\n`;

    stacks.forEach((stack) => {
      markdown += `### Guidelines for ${stack}\n\n`;

      const libraries = librariesByStack[stack];
      if (libraries) {
        libraries.forEach((library) => {
          markdown += `#### ${library}\n\n`;
          markdown += generateLibraryContent(library);
          markdown += '\n\n';
        });
      }

      markdown += '\n';
    });
  });

  return markdown;
}

/**
 * Default project file configuration
 */
export const PROJECT_FILE_CONFIG = {
  label: 'Project',
  fileName: 'project.mdc',
} as const;
