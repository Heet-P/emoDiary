// [FILENAME: src/app/(protected)/layout.tsx]
// [PURPOSE: Layout for authenticated pages with sidebar navigation]
// [DEPENDENCIES: @supabase/ssr, next/navigation]
// [PHASE: Phase 2 - Authentication]

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProtectedLayoutClient } from "./layout-client";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    return (
        <ProtectedLayoutClient
            user={{
                id: user.id,
                email: user.email || "",
                displayName: profile?.display_name || user.email?.split("@")[0] || "User",
            }}
        >
            {children}
        </ProtectedLayoutClient>
    );
}
