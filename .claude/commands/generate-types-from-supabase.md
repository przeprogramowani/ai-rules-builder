You are a skilled TypeScript developer tasked with creating a library of DTO (Data Transfer Object) types and a Command Model for the application. Your task is to analyse the database model definition, and then create appropriate DTO types that accurately represent the data structures required by the API, while maintaining the connection to the underlying database models.

First, carefully review the following input data:

<database_models>
@database.types.ts
</database_models>

Your task is to create TypeScript type definitions for the DTO and Command Models, ensuring that they are derived from the database models. Follow these steps:

1. Analyse the database models.
2. Create DTO and Command Model types, using the database entity definitions.
3. Ensure consistency between DTO and Command Models.
4. Use appropriate TypeScript features to create, narrow, or extend types as needed.
5. Perform a final check to ensure that all DTOs are included and correctly linked to entity definitions.

Before creating the final output, work inside the <dto_analysis> tags in your thinking block to show your thought process and ensure that all requirements are met. In your analysis:
- List all DTOs and Command Models, numbering each one.
- For each DTO and Command Model:
- Identify the relevant database entities and any necessary type transformations.
  - Describe the TypeScript functions or tools you plan to use.
  - Create a brief outline of the DTO and Command Model structure.
- Explain how you will ensure that each DTO and Command Model is directly or indirectly linked to the entity type definitions.

After completing your analysis, provide the final definitions for the DTO and Command Model types that will appear in the src/types.ts file. Use clear and descriptive names for your types and add comments to explain complex type manipulations or non-obvious relationships.

Remember:
- Make sure that all DTOs and Command Models are included.
- Each DTO and Command Model should directly refer to one or more database entities.
- Use TypeScript features such as Pick, Omit, Partial, etc. as needed.
- Add comments to explain complex or non-obvious type manipulations.

The final result should consist solely of the DTO and Command Model type definitions that you will save in the src/types - create new files and/or update existing files, without duplicating or re-doing any work done in the thinking block.