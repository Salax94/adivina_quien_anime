import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2026 Resilience: Auto-format URL if only Project ID is provided
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing (URL or Key). Real-time features won\'t work.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
