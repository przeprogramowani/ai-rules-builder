import type { APIRoute } from 'astro';
import { dependencyParsers, mapDependenciesToLibraries } from './dependencyMappers';

// Mark this endpoint as server-rendered, not static
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the form data
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Error parsing form data:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to parse form data',
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Get the file from form data
    const file = formData.get('file');
    console.log(
      'File from form data:',
      file ? 'exists' : 'missing',
      file instanceof File ? 'is File object' : 'not File object',
    );

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({
          error: 'No file uploaded or invalid file',
          receivedType: typeof file,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    // Find a suitable parser for the file
    const parser = dependencyParsers.find((p) => p.canParse(file.name));

    if (!parser) {
      return new Response(
        JSON.stringify({
          error: 'Unsupported file format',
          supportedFormats: ['package.json', 'requirements.txt'],
          receivedFilename: file.name,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Read and parse the file
    const fileContent = await file.text();
    console.log('File content length:', fileContent.length);

    const dependencies = parser.parse(fileContent);
    console.log('Parsed dependencies count:', dependencies.length);

    // Map dependencies to libraries
    const uniqueLibraries = mapDependenciesToLibraries(dependencies);
    console.log('Mapped libraries count:', uniqueLibraries.length);

    return new Response(
      JSON.stringify({
        success: true,
        libraries: uniqueLibraries,
        identifiedDependencies: dependencies.length,
        mappedLibraries: uniqueLibraries.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Error processing file:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process file',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};
