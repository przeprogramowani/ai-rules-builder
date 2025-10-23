// GDPR: Automatic anonymization of email logs
// This Edge Function should be called daily via Supabase cron or external scheduler
// Example cron: 0 2 * * * (runs at 2 AM daily)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

Deno.serve(async (req) => {
  try {
    // Verify this is a legitimate call (cron job or authenticated admin)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Check if it's from cron (has secret) or is an authenticated request
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Run anonymization function
    const { data: anonymizeResult, error: anonymizeError } = await supabase.rpc(
      'anonymize_old_email_logs',
    );

    if (anonymizeError) {
      console.error('Anonymization error:', anonymizeError);
      return new Response(
        JSON.stringify({
          success: false,
          error: anonymizeError.message,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const anonymizedCount = anonymizeResult || 0;
    console.log(`Anonymized ${anonymizedCount} records`);

    // Optionally: Also run cleanup for very old records (90+ days)
    const { data: cleanupResult, error: cleanupError } =
      await supabase.rpc('cleanup_old_email_logs');

    if (cleanupError) {
      console.error('Cleanup error:', cleanupError);
      // Don't fail the request - anonymization succeeded
    }

    const deletedCount = cleanupResult || 0;
    console.log(`Deleted ${deletedCount} old records`);

    return new Response(
      JSON.stringify({
        success: true,
        anonymized: anonymizedCount,
        deleted: deletedCount,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
});

/*
 * DEPLOYMENT INSTRUCTIONS:
 *
 * 1. Deploy this Edge Function:
 *    npx supabase functions deploy anonymize-email-logs
 *
 * 2. Set environment variables in Supabase dashboard:
 *    SUPABASE_URL=your-project-url
 *    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *    CRON_SECRET=generate-random-secret (optional, for security)
 *
 * 3. Create a cron job to call this function daily:
 *
 *    Option A: GitHub Actions (add to .github/workflows/gdpr-cron.yml)
 *    ```yaml
 *    name: GDPR Anonymization Cron
 *    on:
 *      schedule:
 *        - cron: '0 2 * * *' # 2 AM daily
 *    jobs:
 *      anonymize:
 *        runs-on: ubuntu-latest
 *        steps:
 *          - name: Call anonymization Edge Function
 *            run: |
 *              curl -X POST \
 *                'https://your-project.supabase.co/functions/v1/anonymize-email-logs' \
 *                -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
 *    ```
 *
 *    Option B: External cron service (cron-job.org, etc.)
 *    POST https://your-project.supabase.co/functions/v1/anonymize-email-logs
 *    Header: Authorization: Bearer your-cron-secret
 *
 *    Option C: Supabase native cron (when available)
 *    Check Supabase docs for pg_cron integration
 *
 * 4. Monitor execution:
 *    - Check Edge Function logs in Supabase dashboard
 *    - Query anonymization status:
 *      SELECT COUNT(*) FROM email_send_log WHERE anonymized_at IS NOT NULL;
 */
