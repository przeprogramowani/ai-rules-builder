#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { libraryRules } from '../src/data/rules.ts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RuleRecord {
  library_id: string;
  rule_content: string;
  sort_order: number;
  is_active: boolean;
}

async function migrateRules() {
  console.log('🚀 Starting rules migration to Supabase...');
  
  try {
    // Prepare rules data for insertion
    const rulesData: RuleRecord[] = [];
    let totalRules = 0;
    
    for (const [libraryId, rules] of Object.entries(libraryRules)) {
      if (Array.isArray(rules)) {
        rules.forEach((ruleContent, index) => {
          rulesData.push({
            library_id: libraryId,
            rule_content: ruleContent,
            sort_order: (index + 1) * 10, // Allow space for future insertions
            is_active: true
          });
          totalRules++;
        });
      }
    }
    
    console.log(`📊 Found ${totalRules} rules across ${Object.keys(libraryRules).length} libraries`);
    
    // Clear existing rules (if any)
    console.log('🗑️  Clearing existing rules...');
    const { error: deleteError } = await supabase
      .from('rules')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
    if (deleteError) {
      console.warn('Warning: Could not clear existing rules:', deleteError.message);
    }
    
    // Insert rules in batches (Supabase has a limit on batch size)
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < rulesData.length; i += batchSize) {
      const batch = rulesData.slice(i, i + batchSize);
      console.log(`📤 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rulesData.length / batchSize)} (${batch.length} rules)...`);
      
      const { data, error } = await supabase
        .from('rules')
        .insert(batch)
        .select('id');
        
      if (error) {
        console.error('❌ Error inserting batch:', error);
        throw error;
      }
      
      insertedCount += data?.length || 0;
    }
    
    console.log(`✅ Successfully migrated ${insertedCount} rules to Supabase!`);
    
    // Verify the migration
    const { data: verifyData, error: verifyError } = await supabase
      .from('rules')
      .select('library_id, rule_content')
      .eq('is_active', true);
      
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError);
    } else {
      console.log(`✅ Verification: Found ${verifyData?.length || 0} active rules in database`);
      
      // Group by library for verification
      const libraryCount: Record<string, number> = {};
      verifyData?.forEach(rule => {
        libraryCount[rule.library_id] = (libraryCount[rule.library_id] || 0) + 1;
      });
      
      console.log('📋 Rules per library:');
      Object.entries(libraryCount)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([library, count]) => {
          console.log(`  ${library}: ${count} rules`);
        });
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateRules();