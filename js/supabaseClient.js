// ZeroGravity Supabase Client
// IMPORTANT:
// - The publishable key is intentionally client-side.
// - NEVER put sb_secret_..., service_role, database passwords,
//   or Supabase CLI access tokens in this file.

const SUPABASE_URL = 'https://gqazjrvzkcsrlocokfjp.supabase.co';

// Paste your Supabase PUBLISHABLE key between the quotes.
// This is NOT the secret key.
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_l9VmAx4ufzuJe3lAtzG09A_hJlILg6-';

if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true
            }
        }
    );

}