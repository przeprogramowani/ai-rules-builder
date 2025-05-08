import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { password, confirmPassword } = (await request.json()) as {
      password: string;
      confirmPassword: string;
    };

    if (!password || !confirmPassword || password !== confirmPassword) {
      return new Response(JSON.stringify({ error: 'Password and confirm password must match' }), {
        status: 400,
      });
    }

    const { error } = await locals.supabase.auth.updateUser({
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
      status: 200,
    });
  } catch (err) {
    console.error('Update password endpoint error:', err instanceof Error ? err.message : err);
    if (err instanceof SyntaxError) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 });
  }
};
