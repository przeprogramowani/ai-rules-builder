import { describe, it, expect } from 'vitest';
import { RulesBuilderService } from '../RulesBuilderService';
import { Library, Stack, stackToLibraryMap } from '../../../data/dictionaries';
import { getRulesForLibrary } from '../../../data/rules';
import type { RulesContent } from '../RulesBuilderTypes';
import { Layer } from '../../../data/dictionaries';

describe('RulesBuilderService', () => {
  // Arrange - przykładowe dane testowe
  const projectName = 'Test Project';
  const projectDescription = 'Test Description';

  describe('generateRulesContent - podstawowe przypadki', () => {
    it('powinno wygenerować podstawową strukturę dla pustej listy bibliotek', () => {
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

    it('powinno wygenerować pojedynczy plik z regułami dla jednej biblioteki', () => {
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

  describe('generateRulesContent - tryb wielu plików', () => {
    it('powinno wygenerować oddzielne pliki dla każdej biblioteki', () => {
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
      expect(result.length).toBe(3); // Projekt + 2 biblioteki
      expect(result[0].fileName).toContain('project.mdc'); // Sekcja projektu zawsze pierwszy
      expect(result.some((r) => r.fileName.includes('react'))).toBeTruthy();
    });

    it('powinno grupować biblioteki według warstw i stosów', () => {
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

      // Sprawdzamy czy mamy co najmniej 2 warstwy (FRONTEND, BACKEND) + projekt
      expect(layers.size).toBe(3);

      // Sprawdzamy czy zawiera odpowiednie stosy
      expect(result.some((r) => r.markdown.includes(Stack.REACT))).toBeTruthy();
      expect(result.some((r) => r.markdown.includes(Stack.NODE))).toBeTruthy();
    });
  });

  describe('generateRulesContent - przypadki brzegowe', () => {
    it('powinno zachować unikalność bibliotek w ramach stosu', () => {
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
      // Zliczamy wystąpienia biblioteki w wygenerowanych plikach
      const libraryOccurrences = result.filter((r) =>
        r.markdown.includes(`#### ${duplicateLibrary}`),
      ).length;
      expect(libraryOccurrences).toBe(1);
    });
  });

  describe('generateRulesContent - walidacja typów', () => {
    it('powinno zwracać poprawne typy RulesContent', () => {
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

  describe('generateRulesContent - brak reguł dla biblioteki', () => {
    it('powinno wygenerować domyślną regułę dla nowej biblioteki w systemie', () => {
      // Arrange
      // Dodajemy nową bibliotekę do istniejącego stosu w warstwie FRONTEND
      const newLibrary = 'NEW_FRONTEND_LIB' as Library;
      const stack = Stack.REACT; // Istniejący stos z dictionaries.ts
      const layer = Layer.FRONTEND; // Warstwa nadrzędna dla stosu REACT

      // Rozszerzamy mapowanie stosu na biblioteki
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
      // 1. Sprawdzamy czy mamy dokładnie 2 pliki (projekt + biblioteka)
      expect(result).toHaveLength(2);
      expect(result[0].fileName).toBe('project.mdc');

      // 2. Sprawdzamy czy plik biblioteki ma poprawną strukturę
      const libraryFile = result[1];
      expect(libraryFile.markdown).toContain(`## ${layer}`);
      expect(libraryFile.markdown).toContain(`### Guidelines for ${stack}`);
      expect(libraryFile.markdown).toContain(`#### ${newLibrary}`);
      expect(libraryFile.markdown).toContain(`- Use ${newLibrary} according to best practices`);

      // Cleanup - przywracamy oryginalne mapowanie
      stackToLibraryMap[Stack.REACT] = originalStackToLibrary;
    });
  });
});
