import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Supabase environment variables not configured!');
    console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
    console.error('The app will not function properly without these.');
}

// Log configuration status (without exposing sensitive keys)
console.log('🔧 Supabase Configuration:', {
    url: supabaseUrl ? '✅ Configured' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Configured' : '❌ Missing',
    urlValue: supabaseUrl || 'NOT SET'
});

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    global: {
        headers: {
            'X-Client-Info': 'book-share-app'
        }
    },
    db: {
        schema: 'public'
    },
    // Add timeout for queries
    realtime: {
        timeout: 10000
    }
});
