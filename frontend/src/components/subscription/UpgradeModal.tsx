"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
    const { refresh } = useSubscription();
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleUpgrade = async (tier: "monthly" | "yearly") => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            // 1. Get Razorpay Key
            const keyRes = await fetch(`${API_BASE}/api/subscription/key`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            const { key_id } = await keyRes.json();

            // 2. Create Order
            const orderRes = await fetch(`${API_BASE}/api/subscription/create-order`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ tier })
            });

            if (!orderRes.ok) throw new Error("Failed to create order");
            const orderData = await orderRes.json();

            // 3. Open Razorpay
            const options = {
                key: key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "emoDiary",
                description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Premium Subscription`,
                order_id: orderData.order_id,
                handler: async function (response: any) {
                    const verifyRes = await fetch(`${API_BASE}/api/subscription/verify-payment`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });

                    if (verifyRes.ok) {
                        toast.success("Payment successful! Welcome to Premium.");
                        await refresh();
                        onClose();
                    } else {
                        toast.error("Payment verification failed. Please contact support.");
                    }
                },
                prefill: {
                    email: session.user.email,
                },
                theme: {
                    color: "#064e3b"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error("Payment failed: " + response.error.description);
            });
            rzp.open();

        } catch (error) {
            console.error("Upgrade error:", error);
            toast.error("An error occurred during upgrade.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
                    >
                        <div className="p-8 space-y-6">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl mb-2">
                                    <span className="material-symbols-outlined text-4xl">workspace_premium</span>
                                </div>
                                <h2 className="text-2xl font-bold text-[#064e3b]">Unlock Full Access</h2>
                                <p className="text-[#8ca69e]">
                                    {reason || "You've reached your free limit. Upgrade to continue your emotional wellness journey without interruptions."}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Monthly Plan */}
                                <div className="border border-[#8ca69e]/20 rounded-2xl p-6 bg-[#f8faf9] flex flex-col justify-between hover:border-[#10b981] transition-colors group">
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-[#064e3b]">Monthly</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black">₹299</span>
                                            <span className="text-xs text-[#8ca69e]">/ month</span>
                                        </div>
                                        <ul className="text-xs text-[#8ca69e] space-y-2 pt-4">
                                            <li className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px] text-[#10b981]">check_circle</span>
                                                Unlimited Journals
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px] text-[#10b981]">check_circle</span>
                                                Unlimited Voice Chat
                                            </li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => handleUpgrade("monthly")}
                                        disabled={loading}
                                        className="w-full mt-6 py-2.5 rounded-xl bg-[#064e3b] text-white text-xs font-bold hover:bg-[#0a7c5c] disabled:opacity-50 transition-all"
                                    >
                                        Start Monthly
                                    </button>
                                </div>

                                {/* Yearly Plan */}
                                <div className="border border-[#10b981] rounded-2xl p-6 bg-[#10b981]/5 flex flex-col justify-between relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 bg-[#10b981] text-white text-[8px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-widest">
                                        Best Value
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-[#064e3b]">Yearly</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black">₹2,499</span>
                                            <span className="text-xs text-[#8ca69e]">/ year</span>
                                        </div>
                                        <p className="text-[10px] text-[#10b981] font-bold">Save ~30%</p>
                                        <ul className="text-xs text-[#8ca69e] space-y-2 pt-4">
                                            <li className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px] text-[#10b981]">check_circle</span>
                                                Everything in Monthly
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[14px] text-[#10b981]">check_circle</span>
                                                Personalized AI Reports
                                            </li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => handleUpgrade("yearly")}
                                        disabled={loading}
                                        className="w-full mt-6 py-2.5 rounded-xl bg-[#10b981] text-white text-xs font-bold hover:bg-[#0da673] disabled:opacity-50 transition-all shadow-lg shadow-[#10b981]/20"
                                    >
                                        Go Yearly
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-2 text-xs font-medium text-[#8ca69e] hover:text-[#064e3b] transition-colors"
                            >
                                Maybe later
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
