import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL: Supabase environment variables not configured.');
    console.error('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'book-share-auth',
        flowType: 'pkce'
    },
    global: {
        headers: {
            'X-Client-Info': 'book-share-app'
        },
        fetch: typeof fetch !== 'undefined' ? fetch.bind(globalThis) : undefined
    },
    db: {
        schema: 'public'
    },
    // Add timeout for queries
    realtime: {
        timeout: 10000
    }
});
