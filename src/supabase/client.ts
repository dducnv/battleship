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

const ADJECTIVES = ['Đô Đốc', 'Thuyền Trưởng', 'Sói Biển', 'Hải Quân', 'Lính Thủy', 'Kỹ Sư', 'Thợ Máy'];
const NOUNS = ['Hào Hùng', 'Dũng Cảm', 'Bất Bại', 'Siêu Hạng', 'Thần Tốc', 'Kiên Cường', 'Ẩn Hiện'];

export const myUserName = typeof window !== 'undefined'
  ? sessionStorage.getItem('battleship_name') || (() => {
      const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
      const name = `${adj} ${noun}`;
      sessionStorage.setItem('battleship_name', name);
      return name;
    })()
  : 'Anonymous';

export const joinedAt = typeof window !== 'undefined'
  ? Number(sessionStorage.getItem('battleship_joined_at')) || (() => {
      const now = Date.now();
      sessionStorage.setItem('battleship_joined_at', String(now));
      return now;
    })()
  : Date.now();
