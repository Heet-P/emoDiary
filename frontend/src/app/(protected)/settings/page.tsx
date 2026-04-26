"use client";

import { useEffect, useState } from "react";
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { AvatarHead, AvatarConfig } from "@/components/avatar/AvatarHead";
import { createClient } from "@/lib/supabase/client";
import { getToken } from "@/lib/get-token";
import { motion } from "framer-motion";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SettingsPage() {
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null);
    const [avatarName, setAvatarName] = useState("emoDiary");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAvatar() {
            try {
                const supabase = createClient();
                const token = await getToken(supabase);
                const res = await fetch(`${API_BASE}/api/profile/avatar`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAvatarConfig(data.avatar_config);
                    setAvatarName(data.avatar_name);
                }
            } catch {
                // use defaults
            } finally {
                setLoading(false);
            }
        }
        fetchAvatar();
    }, []);

    const defaultConfig: AvatarConfig = {
        skin: "warm",
        hair: "black",
        headShape: "round",
        accentColor: "#10b981",
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-16 fade-in-up">
            <div>
                <h1 className="text-2xl font-serif text-[#064e3b] mb-1">Settings</h1>
                <p className="text-sm text-[#8ca69e]">Customize your emoDiary experience</p>
            </div>

            {/* Avatar Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-md rounded-2xl border border-[#8ca69e]/20 shadow-sm overflow-hidden"
            >
                <div className="p-6 border-b border-[#8ca69e]/10">
                    <h2 className="text-base font-semibold text-[#064e3b] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">face</span>
                        Your AI Companion Avatar
                    </h2>
                    <p className="text-xs text-[#8ca69e] mt-1">
                        This avatar will appear on the Talk page and lip-sync with the AI voice responses.
                    </p>
                </div>
                <div className="p-6">
                    {loading ? (
                        <div className="h-48 flex items-center justify-center">
                            <span className="material-symbols-outlined text-3xl text-[#8ca69e] animate-spin">progress_activity</span>
                        </div>
                    ) : (
                        <AvatarPicker
                            initialConfig={avatarConfig ?? defaultConfig}
                            initialName={avatarName}
                            onSaved={(cfg, nm) => {
                                setAvatarConfig(cfg);
                                setAvatarName(nm);
                            }}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
}
