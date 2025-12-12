#!/usr/bin/env node

/**
 * Migration Runner Script
 * Applies the due_date column migration and verifies the schema
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials
const supabaseUrl = 'https://bvhgqhxwwgkhwzcazsih.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2aGdxaHh3d2draHd6Y2F6c2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMTE5MTYsImV4cCI6MjA3OTY4NzkxNn0.4ZTCP9nQoDKtNnenNH1m8o9pPo7tw4oX3uboI4vbRo4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
    console.log('🚀 Starting migration: Add due_date to books table\n');

    try {
        // Step 1: Read migration file
        const migrationPath = join(__dirname, 'migrations', '20251127_add_due_date_to_books.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');
        console.log('✓ Migration file loaded');

        // Step 2: Apply migration
        console.log('\n📝 Applying migration...');
        const { error: migrationError } = await supabase.rpc('exec_sql', {
            sql_query: migrationSQL
        });

        // If RPC doesn't exist, try direct SQL execution
        if (migrationError && migrationError.message.includes('function')) {
            console.log('⚠️  RPC function not available, using alternative method...');

            // Split SQL into individual statements and execute
            const statements = migrationSQL
                .split(';')
                .map(s => s.trim())
                .filter(s => s && !s.startsWith('--'));

            for (const statement of statements) {
                if (statement.toLowerCase().includes('alter table')) {
                    const { error } = await supabase.rpc('exec_sql', { query: statement });
                    if (error && !error.message.includes('already exists')) {
                        console.error('❌ Migration error:', error.message);
                    }
                }
            }
        } else if (migrationError) {
            // Check if error is "column already exists"
            if (migrationError.message.includes('already exists')) {
                console.log('✓ Column due_date already exists (migration previously applied)');
            } else {
                throw migrationError;
            }
        } else {
            console.log('✓ Migration applied successfully');
        }

        // Step 3: Verify schema
        console.log('\n🔍 Verifying schema...');

        // Verify using direct query
        const { data: books, error: booksError } = await supabase
            .from('books')
            .select('id, title, due_date')
            .limit(1);

        if (booksError) {
            if (booksError.message.includes('due_date')) {
                console.error('❌ Verification failed: due_date column still missing');
                console.error('Error:', booksError.message);
                throw new Error('Migration did not apply correctly');
            } else {
                console.log('⚠️  Unexpected error during verification:', booksError.message);
            }
        } else {
            console.log('✓ Schema verified: due_date column exists and is queryable');
            console.log('  Sample query result:', books);
        }

        // Step 4: Run smoke test
        console.log('\n🧪 Running smoke test...');
        const { data: testBooks, error: testError } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

        if (testError) {
            console.error('❌ Smoke test failed:', testError.message);
            throw testError;
        }

        console.log('✓ Smoke test passed');
        console.log('  Books in database:', testBooks.length);
        if (testBooks.length > 0) {
            console.log('  Latest book:', {
                id: testBooks[0].id,
                title: testBooks[0].title,
                owner_id: testBooks[0].owner_id,
                due_date: testBooks[0].due_date || 'NULL (not borrowed)'
            });
        }

        // Step 5: Test full books query (as used in frontend)
        console.log('\n🌐 Testing frontend books query...');
        const { data: allBooks, error: fetchError } = await supabase
            .from('books')
            .select(`
                id,
                owner_id,
                title,
                author,
                genre,
                condition,
                cover_url,
                status,
                due_date,
                created_at,
                owner:users!owner_id (
                    id,
                    name,
                    city,
                    reputation
                )
            `)
            .eq('status', 'Available')
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('❌ Frontend query failed:', fetchError.message);
            throw fetchError;
        }

        console.log('✓ Frontend books query successful');
        console.log('  Total available books:', allBooks.length);

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ MIGRATION COMPLETE');
        console.log('='.repeat(60));
        console.log('Migration:        Applied ✓');
        console.log('Schema verified:  ✓');
        console.log('Smoke test:       ✓');
        console.log('Frontend query:   ✓ (200 OK)');
        console.log('Books available:  ' + allBooks.length);
        console.log('\n🎉 The frontend should now load successfully!');

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ MIGRATION FAILED');
        console.error('='.repeat(60));
        console.error('Error:', error.message);
        console.error('\nPlease run this SQL manually in Supabase SQL Editor:');
        console.error('\nALTER TABLE public.books');
        console.error('ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;');
        process.exit(1);
    }
}

runMigration();
