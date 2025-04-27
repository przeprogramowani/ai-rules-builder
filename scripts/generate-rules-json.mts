import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Assuming these paths are correct relative to the script location
const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data');
const i18nDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/i18n');
const mcpServerSourceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../mcp-server/src');
const outputFilePath = path.join(mcpServerSourceDir, 'preparedRules.json');

interface TranslationObject {
  [key: string]: string;
}

interface HierarchyNode {
  id: string;
  name: string;
  children?: HierarchyNode[];
}

async function generateRulesJson() {
  console.log('Starting generation of preparedRules.json...');

  try {
    // Dynamically import modules - adjust paths if necessary
    const { Layer, layerToStackMap, stackToLibraryMap } = await import(path.join(dataDir, 'dictionaries.ts'));
    const { layerTranslations, stackTranslations, libraryTranslations } = await import(path.join(i18nDir, 'translations.ts'));
    // Assuming rules.ts exports a default or named export called libraryRules
    const { libraryRules } = await import(path.join(dataDir, 'rules.ts')); // Adjust import based on actual export

    if (!libraryRules) {
      throw new Error('libraryRules export not found in src/data/rules.ts');
    }

    const hierarchy: HierarchyNode[] = [];

    // Build hierarchy
    for (const layerKey of Object.keys(Layer)) {
      const layerId = Layer[layerKey as keyof typeof Layer];
      const layerName = (layerTranslations as TranslationObject)[layerId] || layerId; // Use ID as fallback
      const layerNode: HierarchyNode = { id: layerId, name: layerName, children: [] };

      const stacks = layerToStackMap[layerId] || [];
      for (const stackId of stacks) {
        const stackName = (stackTranslations as TranslationObject)[stackId] || stackId;
        const stackNode: HierarchyNode = { id: stackId, name: stackName, children: [] };

        const libraries = stackToLibraryMap[stackId] || [];
        for (const libraryId of libraries) {
          const libraryName = (libraryTranslations as TranslationObject)[libraryId] || libraryId;
          const libraryNode: HierarchyNode = { id: libraryId, name: libraryName };
          stackNode.children!.push(libraryNode);
        }

        // Sort libraries alphabetically by name
        stackNode.children!.sort((a, b) => a.name.localeCompare(b.name));
        layerNode.children!.push(stackNode);
      }

      // Sort stacks alphabetically by name
      layerNode.children!.sort((a, b) => a.name.localeCompare(b.name));
      hierarchy.push(layerNode);
    }

    // Sort layers alphabetically by name
    hierarchy.sort((a, b) => a.name.localeCompare(b.name));

    const finalOutput = {
      hierarchy,
      rules: libraryRules, // Use the imported rules directly
    };

    // Write to file
    await fs.writeFile(outputFilePath, JSON.stringify(finalOutput, null, 2));
    console.log(`Successfully generated ${outputFilePath}`);

  } catch (error) {
    console.error('Error generating preparedRules.json:', error);
    process.exit(1); // Exit with error code
  }
}

generateRulesJson();