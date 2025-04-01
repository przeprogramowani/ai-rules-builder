import { describe, it, expect } from 'vitest';
import { RulesBuilderService } from '../RulesBuilderService';
import { Library, Stack, stackToLibraryMap } from '../../../data/dictionaries';
import { getRulesForLibrary } from '../../../data/rules';
import type { RulesContent } from '../RulesBuilderTypes';
import { Layer } from '../../../data/dictionaries';

describe('RulesBuilderService', () => {
  // Arrange - test data
  const projectName = 'Test Project';
  const projectDescription = 'Test Description';

  describe('generateRulesContent - basic cases', () => {
    it('should generate basic structure for empty library list', () => {
      // Arrange
      const selectedLibraries: Library[] = [];

      // Act
      const result = RulesBuilderService.generateRulesContent(
        projectName,
        projectDescription,
        selectedLibraries,
        false,
      );

      // Assert
      expect(result).toHaveLength(1);
      const expectedContent = {
        fileName: 'project.mdc',
        label: 'Project',
        markdown: `# AI Rules for Test Project\n\nTest Description\n\n---\n\n👈 Use the Rule Builder on the left or drop dependency file here`,
      };

      expect(result[0]).toEqual(expectedContent);
    });

    it('should generate a single file with rules for one library', () => {
      // Arrange
      const selectedLibraries = [Library.VITEST];

      // Act
      const result = RulesBuilderService.generateRulesContent(
        projectName,
        projectDescription,
        selectedLibraries,
        false,
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].fileName).toBe('rules.mdc');
      expect(result[0].markdown).toContain('# AI Rules for Test Project');
      expect(result[0].markdown).toContain('#### VITEST');
      expect(result[0].markdown).toContain(getRulesForLibrary(Library.VITEST)[0]);
    });
  });

  describe('generateRulesContent - multi-file mode', () => {
    it('should generate separate files for each library', () => {
      // Arrange
      const selectedLibraries = [Library.REACT_CODING_STANDARDS, Library.ANGULAR_CODING_STANDARDS];

      // Act
      const result = RulesBuilderService.generateRulesContent(
        projectName,
        projectDescription,
        selectedLibraries,
        true,
      );

      // Assert
      expect(result.length).toBe(3); // Project + 2 libraries
      expect(result[0].fileName).toContain('project.mdc'); // Project section always first
      expect(result.some((r) => r.fileName.includes('react'))).toBeTruthy();
    });

    it('should group libraries by layers and stacks', () => {
      // Arrange
      const selectedLibraries = [
        Library.REACT_CODING_STANDARDS, // Frontend/React
        Library.EXPRESS, // Backend/Node
        Library.POSTGRES, // Database/SQL
      ];

      // Act
      const result = RulesBuilderService.generateRulesContent(
        projectName,
        projectDescription,
        selectedLibraries,
        true,
      );

      // Assert
      const layers = new Set(
        result.map((r) => r.markdown.match(/## ([^\n]+)/)?.[1]).filter(Boolean),
      );

      // Check if we have at least 2 layers (FRONTEND, BACKEND) + project
      expect(layers.size).toBe(3);

      // Check if it contains appropriate stacks
      expect(result.some((r) => r.markdown.includes(Stack.REACT))).toBeTruthy();
      expect(result.some((r) => r.markdown.includes(Stack.NODE))).toBeTruthy();
    });
  });

  describe('generateRulesContent - edge cases', () => {
    it('should maintain library uniqueness within a stack', () => {
      // Arrange
      const duplicateLibrary = Library.REACT_CODING_STANDARDS;
      const selectedLibraries = [duplicateLibrary, duplicateLibrary];

      // Act
      const result = RulesBuilderService.generateRulesContent(
        projectName,
        projectDescription,
        selectedLibraries,
        true,
      );

      // Assert
      // Count occurrences of the library in generated files
      const libraryOccurrences = result.filter((r) =>
        r.markdown.includes(`#### ${duplicateLibrary}`),
      ).length;
      expect(libraryOccurrences).toBe(1);
    });
  });

  describe('generateRulesContent - type validation', () => {
    it('should return correct RulesContent types', () => {
      // Arrange
      const result = RulesBuilderService.generateRulesContent(
        projectName,
        projectDescription,
        [Library.REACT_CODING_STANDARDS],
        false,
      );

      // Assert
      result.forEach((content) => {
        expect(content).toMatchObject<RulesContent>({
          markdown: expect.any(String),
          label: expect.any(String),
          fileName: expect.stringMatching(/\.mdc$/),
        });
      });
    });
  });

  describe('generateRulesContent - missing rules for library', () => {
    it('should generate default rule for a new library in the system', () => {
      // Arrange
      // Add a new library to an existing stack in the FRONTEND layer
      const newLibrary = 'NEW_FRONTEND_LIB' as Library;
      const stack = Stack.REACT; // Existing stack from dictionaries.ts
      const layer = Layer.FRONTEND; // Parent layer for REACT stack

      // Extend stack to library mapping
      const originalStackToLibrary = stackToLibraryMap[Stack.REACT];
      stackToLibraryMap[Stack.REACT] = [...originalStackToLibrary, newLibrary];

      // Act
      const result = RulesBuilderService.generateRulesContent(
        projectName,
        projectDescription,
        [newLibrary],
        true,
      );

      // Assert
      // 1. Check if we have exactly 2 files (project + library)
      expect(result).toHaveLength(2);
      expect(result[0].fileName).toBe('project.mdc');

      // 2. Check if the library file has the correct structure
      const libraryFile = result[1];
      expect(libraryFile.markdown).toContain(`## ${layer}`);
      expect(libraryFile.markdown).toContain(`### Guidelines for ${stack}`);
      expect(libraryFile.markdown).toContain(`#### ${newLibrary}`);
      expect(libraryFile.markdown).toContain(`- Use ${newLibrary} according to best practices`);

      // Cleanup - restore original mapping
      stackToLibraryMap[Stack.REACT] = originalStackToLibrary;
    });
  });
});
