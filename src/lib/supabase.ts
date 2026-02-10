import { createClient } from '@supabase/supabase-js';

// Initialize database client with proper session persistence
const databaseUrl = 'https://vqonfzleebbcydfafoio.supabase.co';
const databaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxb25memxlZWJiY3lkZmFmb2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDc2MTIsImV4cCI6MjA3OTIyMzYxMn0.N0bsLp4PgqzxSdGm594LuJYzD5QBG_jPtp-mdI-7S24';


const supabase = createClient(databaseUrl, databaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'level-app-auth',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Export the URL and key for use in edge function calls
export const SUPABASE_URL = databaseUrl;
export const SUPABASE_ANON_KEY = databaseKey;

export { supabase };
