import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sfpbrowoiwequchmtygz.supabase.co';
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'sb_publishable_cJMSfD4ij7Ky8HcFrMvbhA_SEVNKqJA'
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const activeSupabaseUrl = supabaseUrl;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;
