// [FILENAME: src/lib/supabase/client.ts]
// [PURPOSE: Supabase browser client for client components]
// [DEPENDENCIES: @supabase/supabase-js]
// [PHASE: Phase 1 - Scaffolding (will be enhanced in Phase 2 with auth)]

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
