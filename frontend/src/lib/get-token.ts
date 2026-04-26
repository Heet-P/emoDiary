import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the current session's access token for use in Authorization headers.
 *
 * Uses getSession() (reads local cache) rather than getUser() (network round-trip)
 * because the token is forwarded to the FastAPI backend which re-validates it
 * independently via JWT decode. This avoids an extra Supabase Auth network call
 * on every client-side API request.
 */
export async function getToken(supabase: SupabaseClient): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? "";
}
