import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables at startup
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase credentials!\n' +
        'Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file\n' +
        'Current values:\n' +
        `  VITE_SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}\n` +
        `  VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓ Set' : '✗ Missing'}`
    );
}

// Create single Supabase client with production-ready configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'book-share-auth',
        flowType: 'pkce' // More secure auth flow
    },
    global: {
        headers: {
            'X-Client-Info': 'book-share-app'
        }
    },
    db: {
        schema: 'public'
    },
    realtime: {
        timeout: 10000
    }
});
