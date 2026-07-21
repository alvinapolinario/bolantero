import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const extra = Constants.expoConfig?.extra ?? {};

export const supabase = createClient(
  (extra.supabaseUrl as string) ||
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    "http://127.0.0.1:54321",
  (extra.supabaseAnonKey as string) ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    "public-anon-key",
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
