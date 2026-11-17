import { createClient } from "@supabase/supabase-js";

// Accept either the project URL or a URL ending in /rest/v1.
// Supabase Auth expects the project root URL.
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = rawSupabaseUrl?.replace(/\/rest\/v1\/?$/, "");
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Hiányzik a VITE_SUPABASE_URL vagy a VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
