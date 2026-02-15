// [FILENAME: src/app/(auth)/sign-up/page.tsx]
// [PURPOSE: Warm MindSpace-themed sign-up page]
// [PHASE: UI Redesign v2 - Warm Theme]

"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const supabase = createClient();
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName || email.split("@")[0],
                    },
                },
            });

            if (signUpError) {
                setError(signUpError.message);
                return;
            }

            setSuccess(true);
        } catch {
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full abstract-blob bg-orange-100/40" />
                <Card className="w-full max-w-md border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm shadow-xl fade-in-up">
                    <CardHeader className="text-center">
                        <span className="material-symbols-outlined text-primary text-4xl mx-auto mb-2">mail</span>
                        <CardTitle className="serif-text text-xl font-light">Check your email</CardTitle>
                        <CardDescription className="text-[#8ca69e]">
                            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                            Click the link to activate your account.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Link href="/sign-in">
                            <Button variant="outline" className="rounded-lg border-[#8ca69e]/20">
                                Back to Sign In
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full abstract-blob bg-orange-100/40" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[40%] rounded-full abstract-blob bg-amber-100/30" />

            <Card className="w-full max-w-md border-[#8ca69e]/20 bg-white/60 backdrop-blur-sm shadow-xl shadow-[#8ca69e]/5 fade-in-up relative z-10">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-3xl">spa</span>
                    </div>
                    <CardTitle className="serif-text text-2xl font-light">Create your account</CardTitle>
                    <CardDescription className="text-[#8ca69e]">
                        Start your journey with emoDiary
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
                            <Input
                                id="displayName"
                                type="text"
                                placeholder="How should we call you?"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="rounded-lg border-[#8ca69e]/20"
                            />
                        </div>
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
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="rounded-lg border-[#8ca69e]/20"
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full rounded-lg" disabled={loading}>
                            {loading ? "Creating account..." : "Sign Up"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-[#8ca69e]">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-primary font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
