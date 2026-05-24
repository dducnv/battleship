import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('Supabase environment variables are missing! Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Generate a random user ID for anonymous presence if needed.
 */
export const myUserId = typeof window !== 'undefined' 
  ? sessionStorage.getItem('battleship_uid') || (() => {
      const id = 'user_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('battleship_uid', id);
      return id;
    })()
  : 'server_user';
