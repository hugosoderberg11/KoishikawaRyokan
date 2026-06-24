export const CONTACT_EMAIL = 'koishikawavibecoding@gmail.com';

export const SUPABASE_PROJECT_REF = 'vruxpxocefqxoxrwexhj';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  `https://${SUPABASE_PROJECT_REF}.supabase.co`;

export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => Boolean(SUPABASE_URL);
