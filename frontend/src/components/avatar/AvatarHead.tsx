"use client";

import { useEffect, useRef } from "react";

export type AvatarConfig = {
    skin: string;
    hair: string;
    headShape: string;
    accentColor: string;
};

const SKIN_COLORS: Record<string, string> = {
    warm:  "#F5C9A0",
    cool:  "#D4BDCE",
    light: "#FDDBB4",
    tan:   "#D4956A",
    deep:  "#8D5524",
};

const HAIR_COLORS: Record<string, string> = {
    black:  "#1a1a1a",
    brown:  "#6B3A2A",
    blonde: "#D4A84B",
    auburn: "#922B21",
    grey:   "#95a5a6",
};

interface AvatarHeadProps {
    config: AvatarConfig;
    name: string;
    lipSyncValue?: number; // 0.0 to 1.0
    size?: number;
    isSpeaking?: boolean;
}

export function AvatarHead({
    config,
    name,
    lipSyncValue = 0,
    size = 160,
    isSpeaking = false,
}: AvatarHeadProps) {
    const skinColor = SKIN_COLORS[config.skin] ?? SKIN_COLORS.warm;
    const hairColor = HAIR_COLORS[config.hair] ?? HAIR_COLORS.black;
    const accent = config.accentColor ?? "#10b981";

    // Mouth open height: 0 closed, 1 fully open
    const mouthRy = 2 + lipSyncValue * 9; // 2px → 11px
    const mouthRx = 12;

    // Head shape: rx for the ellipse
    const headRx = config.headShape === "round" ? 60
        : config.headShape === "oval" ? 48
        : 55; // square-ish

    return (
        <div className="flex flex-col items-center gap-3 select-none">
            {/* Name badge */}
            <div
                className="px-3 py-1 rounded-full text-xs font-semibold shadow-sm border"
                style={{
                    backgroundColor: `${accent}22`,
                    borderColor: `${accent}55`,
                    color: accent,
                }}
            >
                {name}
            </div>

            {/* SVG Avatar */}
            <div className="relative">
                {/* Accent glow ring when speaking */}
                {isSpeaking && (
                    <div
                        className="absolute inset-0 rounded-full animate-ping opacity-20"
                        style={{ backgroundColor: accent }}
                    />
                )}
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 160 170"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Accent ring */}
                    <ellipse
                        cx="80"
                        cy="88"
                        rx={headRx + 8}
                        ry="72"
                        fill={accent}
                        opacity="0.18"
                    />
                    {/* Neck */}
                    <rect x="68" y="138" width="24" height="22" rx="6" fill={skinColor} />
                    {/* Head */}
                    <ellipse cx="80" cy="88" rx={headRx} ry="62" fill={skinColor} />
                    {/* Hair — top arc */}
                    <ellipse cx="80" cy="55" rx={headRx} ry="36" fill={hairColor} />
                    <ellipse cx="80" cy="70" rx={headRx - 4} ry="20" fill={skinColor} />
                    {/* Left eye */}
                    <ellipse cx="62" cy="90" rx="8" ry="9" fill="white" />
                    <ellipse cx="62" cy="91" rx="5" ry="6" fill="#2d3748" />
                    <circle cx="64" cy="89" r="1.5" fill="white" />
                    {/* Right eye */}
                    <ellipse cx="98" cy="90" rx="8" ry="9" fill="white" />
                    <ellipse cx="98" cy="91" rx="5" ry="6" fill="#2d3748" />
                    <circle cx="100" cy="89" r="1.5" fill="white" />
                    {/* Nose */}
                    <ellipse cx="80" cy="108" rx="4" ry="3" fill={skinColor} stroke={hairColor} strokeWidth="1" opacity="0.4" />
                    {/* Mouth outer */}
                    <ellipse
                        cx="80"
                        cy="122"
                        rx={mouthRx}
                        ry={mouthRy}
                        fill={mouthRy > 3 ? "#c0392b" : "#e8a598"}
                        className="transition-[ry] duration-75 ease-out"
                    />
                    {/* Teeth — only visible when open */}
                    {mouthRy > 4 && (
                        <ellipse
                            cx="80"
                            cy="119"
                            rx={mouthRx - 2}
                            ry={mouthRy * 0.5}
                            fill="white"
                        />
                    )}
                    {/* Ear left */}
                    <ellipse cx={80 - headRx + 2} cy="92" rx="7" ry="10" fill={skinColor} />
                    {/* Ear right */}
                    <ellipse cx={80 + headRx - 2} cy="92" rx="7" ry="10" fill={skinColor} />
                </svg>
            </div>
        </div>
    );
}
