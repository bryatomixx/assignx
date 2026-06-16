import { createClient } from "@supabase/supabase-js";

// Browser/client Supabase client using the publishable key. Row Level Security
// applies to every request made with this client. Safe to use in the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, publishableKey);
