"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { UpgradeModal } from "@/components/subscription/UpgradeModal";
import { useSubscription } from "@/hooks/use-subscription";

const perks = [
    { icon: "book", label: "Unlimited Journal Entries" },
    { icon: "mic", label: "Unlimited Voice Sessions" },
];

export default function UpgradePage() {
    const router = useRouter();
    const { status, loading } = useSubscription();
    const [selectedModal, setSelectedModal] = useState<"monthly" | "yearly" | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialTier, setInitialTier] = useState<"monthly" | "yearly">("yearly");

    // If premium, redirect to dashboard
    useEffect(() => {
        if (!loading && status?.is_premium) {
            router.push("/dashboard");
        }
    }, [status, loading, router]);

    const handleSelect = (tier: "monthly" | "yearly") => {
        setInitialTier(tier);
        setIsModalOpen(true);
    };

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 fade-in-up">
            {/* Hero */}
            <div className="text-center mb-12 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold tracking-wide mb-2">
                    <span className="material-symbols-outlined text-base">workspace_premium</span>
                    emoDiary Premium
                </div>
                <h1 className="serif-text text-4xl md:text-5xl font-light text-[#064e3b]">
                    Unlock Your Full Journey
                </h1>
                <p className="text-[#8ca69e] text-lg max-w-xl mx-auto leading-relaxed">
                    Continue your emotional wellness journey without limits. Get unlimited access to all features.
                </p>
            </div>

            {/* Perks */}
            <div className="flex justify-center gap-4 mb-14">
                {perks.map((p) => (
                    <div key={p.icon} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-[#8ca69e]/15 text-center hover:border-[#10b981]/40 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#10b981] text-xl">{p.icon}</span>
                        </div>
                        <p className="text-[11px] text-[#064e3b] font-medium leading-tight">{p.label}</p>
                    </div>
                ))}
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">

                {/* Monthly */}
                <motion.div
                    whileHover={{ y: -4 }}
                    className="rounded-3xl border border-[#8ca69e]/20 bg-white p-8 flex flex-col gap-6 shadow-sm"
                >
                    <div>
                        <p className="text-xs font-semibold text-[#8ca69e] uppercase tracking-widest mb-2">Monthly</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-[#064e3b]">₹299</span>
                            <span className="text-sm text-[#8ca69e]">/ month</span>
                        </div>
                        <p className="text-xs text-[#8ca69e] mt-1">Billed monthly. Cancel anytime.</p>
                    </div>
                    <ul className="space-y-2.5 flex-1">
                        {perks.map((p) => (
                            <li key={p.icon} className="flex items-center gap-2 text-sm text-[#064e3b]">
                                <span className="material-symbols-outlined text-[#10b981] text-base">check_circle</span>
                                {p.label}
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={() => handleSelect("monthly")}
                        className="w-full py-3 rounded-2xl bg-[#064e3b] text-white text-sm font-bold hover:bg-[#0a7c5c] transition-all"
                    >
                        Start Monthly Plan
                    </button>
                </motion.div>

                {/* Yearly */}
                <motion.div
                    whileHover={{ y: -4 }}
                    className="rounded-3xl border-2 border-[#10b981] bg-gradient-to-b from-[#10b981]/5 to-white p-8 flex flex-col gap-6 shadow-lg shadow-[#10b981]/10 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 bg-[#10b981] text-white text-[9px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest">
                        Best Value
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-[#10b981] uppercase tracking-widest mb-2">Yearly</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-[#064e3b]">₹2,499</span>
                            <span className="text-sm text-[#8ca69e]">/ year</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-[#10b981] font-bold">Save ~30%</span>
                            <span className="text-xs text-[#8ca69e] line-through">₹3,588</span>
                        </div>
                    </div>
                    <ul className="space-y-2.5 flex-1">
                        {perks.map((p) => (
                            <li key={p.icon} className="flex items-center gap-2 text-sm text-[#064e3b]">
                                <span className="material-symbols-outlined text-[#10b981] text-base">check_circle</span>
                                {p.label}
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={() => handleSelect("yearly")}
                        className="w-full py-3 rounded-2xl bg-[#10b981] text-white text-sm font-bold hover:bg-[#0da673] transition-all shadow-md shadow-[#10b981]/30"
                    >
                        Get Yearly Plan
                    </button>
                </motion.div>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-[#8ca69e]/60 mt-8">
                🔒 Secure payments via Razorpay. UPI, Cards, NetBanking accepted.
            </p>

            <UpgradeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                reason={`Unlock premium with the ${initialTier} plan for unlimited access.`}
            />
        </div>
    );
}
