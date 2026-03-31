import { createClient } from '@supabase/supabase-js';

// Initialize database client with proper session persistence
const databaseUrl = const databaseUrl = 'https://djrsmuafbbzxpbdibolq.supabase.co';
const databaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcnNtdWFmYmJ6eHBiZGlib2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODE1OTIsImV4cCI6MjA5MDU1NzU5Mn0.vIKq1NjFXX3w7Jj09AEU8F4KLxG9O6TA-bsDl7vFKlw';

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
