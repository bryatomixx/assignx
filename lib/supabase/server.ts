import { createClient } from "@supabase/supabase-js";

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
