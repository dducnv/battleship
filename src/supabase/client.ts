import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
