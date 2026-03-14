"use client";

import { useState } from "react";
import { AvatarHead, AvatarConfig } from "@/components/avatar/AvatarHead";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SKINS = [
    { id: "warm",  hex: "#F5C9A0", label: "Warm" },
    { id: "cool",  hex: "#D4BDCE", label: "Cool" },
    { id: "light", hex: "#FDDBB4", label: "Light" },
    { id: "tan",   hex: "#D4956A", label: "Tan" },
    { id: "deep",  hex: "#8D5524", label: "Deep" },
];

const HAIRS = [
    { id: "black",  hex: "#1a1a1a", label: "Black" },
    { id: "brown",  hex: "#6B3A2A", label: "Brown" },
    { id: "blonde", hex: "#D4A84B", label: "Blonde" },
    { id: "auburn", hex: "#922B21", label: "Auburn" },
    { id: "grey",   hex: "#95a5a6", label: "Grey" },
];

const HEAD_SHAPES = [
    { id: "round",  label: "Round" },
    { id: "oval",   label: "Oval" },
    { id: "square", label: "Square" },
];

const ACCENTS = [
    "#10b981", // emerald (default)
    "#064e3b", // dark green
    "#d97706", // amber
    "#7c3aed", // violet
    "#0284c7", // blue
    "#db2777", // pink
];

interface AvatarPickerProps {
    initialConfig?: AvatarConfig;
    initialName?: string;
    onSaved?: (config: AvatarConfig, name: string) => void;
}

async function getToken() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
}

export function AvatarPicker({ initialConfig, initialName, onSaved }: AvatarPickerProps) {
    const [config, setConfig] = useState<AvatarConfig>({
        skin: initialConfig?.skin ?? "warm",
        hair: initialConfig?.hair ?? "black",
        headShape: initialConfig?.headShape ?? "round",
        accentColor: initialConfig?.accentColor ?? "#10b981",
    });
    const [name, setName] = useState(initialName ?? "emoDiary");
    const [saving, setSaving] = useState(false);

    const update = (key: keyof AvatarConfig, val: string) =>
        setConfig((c) => ({ ...c, [key]: val }));

    async function handleSave() {
        if (!name.trim()) {
            toast.error("Please enter an avatar name");
            return;
        }
        setSaving(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/profile/avatar`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ avatar_config: config, avatar_name: name }),
            });
            if (!res.ok) throw new Error("Save failed");
            toast.success("Avatar saved! ✨");
            onSaved?.(config, name);
        } catch {
            toast.error("Failed to save avatar");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Live Preview */}
            <div className="flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-amber-50/50 rounded-2xl border border-emerald-100 p-8 min-w-[220px]">
                <p className="text-xs text-[#8ca69e] uppercase tracking-widest mb-6">Preview</p>
                <AvatarHead config={config} name={name} lipSyncValue={0} size={160} />
            </div>

            {/* Controls */}
            <div className="flex-1 space-y-6">
                {/* Name */}
                <div>
                    <label className="block text-xs font-semibold text-[#064e3b] uppercase tracking-widest mb-2">
                        Avatar Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={20}
                        placeholder="e.g. Aria, Sage, Nova..."
                        className="w-full px-4 py-2.5 rounded-xl border border-[#8ca69e]/30 bg-white text-[#064e3b] text-sm
                                   focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]/30 transition-all"
                    />
                </div>

                {/* Skin tone */}
                <div>
                    <label className="block text-xs font-semibold text-[#064e3b] uppercase tracking-widest mb-2">
                        Skin Tone
                    </label>
                    <div className="flex gap-3 flex-wrap">
                        {SKINS.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => update("skin", s.id)}
                                title={s.label}
                                className={`w-9 h-9 rounded-full border-2 transition-all ${config.skin === s.id ? "border-[#064e3b] scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
                                style={{ backgroundColor: s.hex }}
                            />
                        ))}
                    </div>
                </div>

                {/* Hair color */}
                <div>
                    <label className="block text-xs font-semibold text-[#064e3b] uppercase tracking-widest mb-2">
                        Hair Color
                    </label>
                    <div className="flex gap-3 flex-wrap">
                        {HAIRS.map((h) => (
                            <button
                                key={h.id}
                                onClick={() => update("hair", h.id)}
                                title={h.label}
                                className={`w-9 h-9 rounded-full border-2 transition-all ${config.hair === h.id ? "border-[#064e3b] scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
                                style={{ backgroundColor: h.hex }}
                            />
                        ))}
                    </div>
                </div>

                {/* Head shape */}
                <div>
                    <label className="block text-xs font-semibold text-[#064e3b] uppercase tracking-widest mb-2">
                        Head Shape
                    </label>
                    <div className="flex gap-2">
                        {HEAD_SHAPES.map((h) => (
                            <button
                                key={h.id}
                                onClick={() => update("headShape", h.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${config.headShape === h.id
                                    ? "bg-[#064e3b] text-white border-[#064e3b]"
                                    : "bg-white text-[#8ca69e] border-[#8ca69e]/30 hover:border-[#064e3b]/40"
                                    }`}
                            >
                                {h.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Accent color */}
                <div>
                    <label className="block text-xs font-semibold text-[#064e3b] uppercase tracking-widest mb-2">
                        Accent Color
                    </label>
                    <div className="flex gap-3 flex-wrap">
                        {ACCENTS.map((color) => (
                            <button
                                key={color}
                                onClick={() => update("accentColor", color)}
                                title={color}
                                className={`w-9 h-9 rounded-full border-2 transition-all ${config.accentColor === color ? "border-[#064e3b] scale-110 shadow-md" : "border-white hover:scale-105"}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Save */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 rounded-xl bg-[#064e3b] text-white text-sm font-semibold hover:bg-[#0a7c5c] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-base">{saving ? "sync" : "save"}</span>
                    {saving ? "Saving..." : "Save Avatar"}
                </motion.button>
            </div>
        </div>
    );
}
