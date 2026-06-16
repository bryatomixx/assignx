import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Admin client (service role, bypasses RLS)
// ---------------------------------------------------------------------------
// Server-only Supabase client using the secret key. This key BYPASSES Row Level
// Security, so it must never reach the browser. Do not import this module from a
// client component; use it only in server actions, route handlers, or server
// components. SUPABASE_SECRET_KEY is not prefixed NEXT_PUBLIC, so Next never
// bundles it into client code.

export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient must only be used on the server.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not set.");
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Server session client (anon key, reads/writes cookies)
// ---------------------------------------------------------------------------
// Use this in route handlers and server components when you need the
// authenticated user's session. The client refreshes the access token
// automatically via cookie. userId must be derived from getUser(), never
// from the request body.

export async function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
    );
  }

  // cookies() is async in Next.js 16 (App Router).
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll is called from Server Components where setting cookies is
          // not allowed. The proxy.ts (middleware) handles the actual refresh.
        }
      },
    },
  });
}
