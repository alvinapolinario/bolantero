import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type BolanteroClient = SupabaseClient;

export function createBrowserClient(
  url: string,
  anonKey: string,
): BolanteroClient {
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function createServerClient(
  url: string,
  anonKey: string,
  accessToken?: string,
): BolanteroClient {
  return createClient(url, anonKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
