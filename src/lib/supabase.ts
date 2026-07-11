'use client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Returns a singleton Supabase client, or null when env vars are not set
 *  (so the app still builds and runs as a single-player preview). */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!URL || !KEY) return null;
  if (!client) {
    client = createClient(URL, KEY, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
  }
  return client;
}

export const hasSupabase = (): boolean => !!(URL && KEY);
