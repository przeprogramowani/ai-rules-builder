import { describe, it, expect } from 'vitest';
import { Layer, Stack, Library, layerToStackMap, stackToLibraryMap } from '../data/dictionaries';
import { layerTranslations, stackTranslations, libraryTranslations } from './translations';

describe('Translation Coverage', () => {
  describe('Layer Translation Coverage', () => {
    it('should have translations for all Layer enum values', () => {
      // Arrange
      const layerEnumValues = Object.values(Layer);
      const translationKeys = Object.keys(layerTranslations);

      // Act & Assert
      // Check if all enum values have translations
      layerEnumValues.forEach((layer) => {
        expect(layerTranslations[layer as Layer]).toBeDefined();
        expect(typeof layerTranslations[layer as Layer]).toBe('string');
        expect(layerTranslations[layer as Layer].length).toBeGreaterThan(0);
      });

      // Check if there are no extra translations
      expect(translationKeys.length).toBe(layerEnumValues.length);
    });
  });

  describe('Stack Translation Mapping', () => {
    it('should have valid translations for all stacks referenced in layerToStackMap', () => {
      // Arrange
      const usedStacks = new Set<Stack>();
      Object.values(layerToStackMap).forEach((stacks) => {
        stacks.forEach((stack) => usedStacks.add(stack));
      });

      // Act & Assert
      // Check if all used stacks have translations
      usedStacks.forEach((stack) => {
        expect(stackTranslations[stack]).toBeDefined();
        expect(typeof stackTranslations[stack]).toBe('string');
        expect(stackTranslations[stack].length).toBeGreaterThan(0);
      });

      // Check if there are no orphaned translations
      Object.keys(stackTranslations).forEach((translationKey) => {
        expect(usedStacks.has(translationKey as Stack)).toBe(true);
      });
    });
  });

  describe('Library Translation Chain', () => {
    it('should have translations for all libraries referenced in stackToLibraryMap', () => {
      // Arrange
      const usedLibraries = new Set<Library>();
      Object.values(stackToLibraryMap).forEach((libraries) => {
        libraries.forEach((library) => usedLibraries.add(library));
      });
      const translationValues = new Set(Object.values(libraryTranslations));

      // Act & Assert
      // Check if all used libraries have translations
      usedLibraries.forEach((library) => {
        expect(libraryTranslations[library]).toBeDefined();
        expect(typeof libraryTranslations[library]).toBe('string');
        expect(libraryTranslations[library].length).toBeGreaterThan(0);
      });

      // Check if there are no orphaned translations
      Object.keys(libraryTranslations).forEach((translationKey) => {
        expect(usedLibraries.has(translationKey as Library)).toBe(true);
      });

      // Check for duplicate translations
      expect(translationValues.size).toBe(Object.keys(libraryTranslations).length);
    });
  });
});
