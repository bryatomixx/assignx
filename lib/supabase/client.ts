import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client using @supabase/ssr. Persists the session in cookies
// so the server-side client (createServerSupabase) can read the same session.
// RLS applies to every request made with this client. Safe to use in the browser.

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
    );
  }
  _client = createBrowserClient(url, anonKey);
  return _client;
}
