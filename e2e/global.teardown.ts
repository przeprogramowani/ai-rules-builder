import { test as teardown } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

teardown('cleanup database', async () => {
  console.log('Cleaning up test database...');

  if (!process.env.SUPABASE_URL!.includes('ueardaqpl')) {
    throw new Error('Cannot run teardown on non-test database!');
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLIC_KEY!);

  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('user_id', process.env.E2E_USERNAME_ID);

    if (error) {
      console.error('Error cleaning up collections:', error);
      throw error;
    }

    console.log('Successfully cleaned up collections for E2E test user');
  } catch (error) {
    console.error('Failed to clean up database:', error);
    throw error;
  }
});
