#!/usr/bin/env node

/**
 * Schema Verification Script
 * Checks if due_date column exists and tests the frontend query
 */

import { createClient } from '@supabase/supabase-js';

// Supabase credentials from .env
const supabaseUrl = 'https://bvhgqhxwwgkhwzcazsih.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2aGdxaHh3d2draHd6Y2F6c2loIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMTE5MTYsImV4cCI6MjA3OTY4NzkxNn0.4ZTCP9nQoDKtNnenNH1m8o9pPo7tw4oX3uboI4vbRo4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySchema() {
    console.log('🔍 Book Share Schema Verification\n');
    console.log('Supabase URL:', supabaseUrl);
    console.log('');

    try {
        // Test 1: Try to query due_date column
        console.log('Test 1: Checking if due_date column exists...');
        const { data: testQuery, error: testError } = await supabase
            .from('books')
            .select('id, title, due_date, status')
            .limit(1);

        if (testError) {
            if (testError.message.includes('due_date')) {
                console.log('❌ FAILED: due_date column does NOT exist');
                console.log('   Error:', testError.message);
                console.log('\n⚠️  ACTION REQUIRED:');
                console.log('   Run this migration in Supabase SQL Editor:');
                console.log('   \x1b[33m');
                console.log('   ALTER TABLE public.books');
                console.log('   ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;');
                console.log('   \x1b[0m');
                process.exit(1);
            } else {
                throw testError;
            }
        }

        console.log('✓ PASSED: due_date column exists');
        console.log('  Query returned:', testQuery.length, 'row(s)');
        if (testQuery.length > 0) {
            console.log('  Sample:', {
                id: testQuery[0].id,
                title: testQuery[0].title,
                due_date: testQuery[0].due_date || 'NULL'
            });
        }

        // Test 2: Full frontend query
        console.log('\nTest 2: Running full frontend books query...');
        const { data: books, error: fetchError } = await supabase
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
            console.log('❌ FAILED: Frontend query error');
            console.log('   Error:', fetchError.message);
            throw fetchError;
        }

        console.log('✓ PASSED: Frontend query successful (200 OK)');
        console.log('  Books fetched:', books.length);

        // Test 3: Check for missing columns
        console.log('\nTest 3: Checking all required columns...');
        const requiredColumns = [
            'id', 'owner_id', 'title', 'author', 'genre',
            'condition', 'cover_url', 'status', 'due_date', 'created_at'
        ];

        const { data: sampleBook } = await supabase
            .from('books')
            .select('*')
            .limit(1)
            .single();

        if (sampleBook) {
            const existingColumns = Object.keys(sampleBook);
            const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

            if (missingColumns.length > 0) {
                console.log('⚠️  WARNING: Missing columns:', missingColumns.join(', '));
            } else {
                console.log('✓ PASSED: All required columns exist');
            }
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ VERIFICATION COMPLETE');
        console.log('='.repeat(60));
        console.log('due_date column:     ✓ EXISTS');
        console.log('Frontend query:      ✓ 200 OK');
        console.log('Books available:     ' + books.length);
        console.log('\n🎉 Database schema is correct. Frontend should load!');
        console.log('');

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ VERIFICATION FAILED');
        console.error('='.repeat(60));
        console.error('Error:', error.message);
        console.error('\nThe database schema is missing required columns.');
        console.error('Please apply the migration manually.');
        process.exit(1);
    }
}

verifySchema();
