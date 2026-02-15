// [FILENAME: src/app/(protected)/layout-client.tsx]
// [PURPOSE: Warm MindSpace-themed header with glass nav, sage/teal palette]
// [PHASE: UI Redesign v2 - Warm Theme]

"use client";

import { useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StaggeredMenu, StaggeredMenuHandle } from "@/components/ui/staggered-menu";

interface UserInfo {
    id: string;
    email: string;
    displayName: string;
}

const navItems = [
    { href: "/dashboard", label: "Dashboard", ariaLabel: "Go to Dashboard" },
    { href: "/journal", label: "Journal", ariaLabel: "Go to Journal" },
    { href: "/talk", label: "Talk", ariaLabel: "Go to Voice Chat" },
    { href: "/insights", label: "Insights", ariaLabel: "Go to Insights" },
    { href: "/settings", label: "Settings", ariaLabel: "Go to Settings" },
];

export function ProtectedLayoutClient({
    user,
    children,
}: {
    user: UserInfo;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [signingOut, setSigningOut] = useState(false);
    const menuRef = useRef<StaggeredMenuHandle>(null);

    const handleSignOut = async () => {
        setSigningOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/sign-in");
        router.refresh();
    };

    const initials = user.displayName
        ? user.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "U";

    const activePage = navItems.find(
        i => pathname === i.href || pathname.startsWith(i.href + "/")
    )?.label || "Page";

    return (
        <div className="min-h-screen">
            {/* StaggeredMenu — hidden header, controlled via ref */}
            <StaggeredMenu
                ref={menuRef}
                position="left"
                isFixed={true}
                hideHeader={true}
                colors={["#064e3b", "#0a7c5c"]}
                accentColor="#0da2e7"
                menuButtonColor="#064e3b"
                openMenuButtonColor="#fefcfa"
                changeMenuColorOnOpen={true}
                closeOnClickAway={true}
                items={navItems.map((item) => ({
                    label: item.label,
                    ariaLabel: item.ariaLabel,
                    link: item.href,
                }))}
                displaySocials={false}
                displayItemNumbering={false}
            />

            {/* Header */}
            <header className="glass-effect sticky top-0 z-50 border-b border-[#8ca69e]/10">
                <div className="flex items-center justify-between px-5 py-4 md:px-8 max-w-[1440px] mx-auto w-full">
                    {/* LEFT: Logo + Menu toggle */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-2xl">spa</span>
                            <span className="font-bold tracking-tight text-lg">emoDiary</span>
                        </div>

                        <div className="hidden sm:block w-px h-5 bg-[#8ca69e]/20" />

                        <button
                            onClick={() => menuRef.current?.toggle()}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[#8ca69e] hover:text-foreground hover:bg-[#8ca69e]/10 transition-colors"
                            aria-label="Toggle navigation menu"
                        >
                            <span className="material-symbols-outlined text-xl">menu</span>
                            <span className="hidden sm:inline">Menu</span>
                        </button>
                    </div>

                    {/* RIGHT: Active page + User info */}
                    <div className="flex items-center gap-3 md:gap-5">
                        <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-[#8ca69e]/10 text-[#8ca69e] text-xs font-semibold uppercase tracking-wider">
                            {activePage}
                        </span>

                        <div className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-full bg-[#064e3b] flex items-center justify-center text-[#fefcfa] text-xs font-bold"
                                title={`${user.displayName} (${user.email})`}
                            >
                                {initials}
                            </div>
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                <button
                                    onClick={handleSignOut}
                                    disabled={signingOut}
                                    className="text-xs text-[#8ca69e] hover:text-destructive transition-colors mt-0.5"
                                >
                                    {signingOut ? "Signing out..." : "Sign Out"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Page Content */}
            <main className="p-4 md:p-8 max-w-[1200px] mx-auto">
                {children}
            </main>
        </div>
    );
}
