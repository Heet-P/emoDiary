// [FILENAME: src/app/(auth)/sign-in/page.tsx]
// [PURPOSE: Warm MindSpace-themed sign-in page]
// [PHASE: UI Redesign v2 - Warm Theme]

"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

function SignInForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const supabase = createClient();
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                setError(signInError.message);
                return;
            }

            router.push(redirectTo);
            router.refresh();
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm shadow-xl shadow-[#8ca69e]/5 fade-in-up">
            <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-3xl">spa</span>
                </div>
                <CardTitle className="serif-text text-2xl font-light">Welcome back</CardTitle>
                <CardDescription className="text-[#8ca69e]">
                    Sign in to your emoDiary account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="rounded-lg border-[#8ca69e]/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">Password</label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="rounded-lg border-[#8ca69e]/20"
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            {error}
                        </div>
                    )}
                    <Button type="submit" className="w-full rounded-lg" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-[#8ca69e]">
                    Don&apos;t have an account?{" "}
                    <Link href="/sign-up" className="text-primary font-medium hover:underline">
                        Sign up
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full abstract-blob bg-orange-100/40" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] rounded-full abstract-blob bg-amber-100/30" />
            <Suspense fallback={
                <Card className="w-full max-w-md border-[#8ca69e]/20 bg-white/60 shadow-xl">
                    <CardHeader className="text-center">
                        <span className="material-symbols-outlined text-primary text-3xl mx-auto">spa</span>
                        <CardTitle className="serif-text text-2xl font-light">Loading...</CardTitle>
                    </CardHeader>
                </Card>
            }>
                <SignInForm />
            </Suspense>
        </div>
    );
}
