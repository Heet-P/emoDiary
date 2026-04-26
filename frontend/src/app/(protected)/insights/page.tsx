// [FILENAME: src/app/(protected)/insights/page.tsx]
// [PURPOSE: Analytics dashboard - fully redesigned with new chart components]
// [PHASE: Phase 10 - Insights UI Overhaul]

"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { getToken } from "@/lib/get-token";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/language-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PIE_COLORS = ["#064e3b", "#10b981", "#d97706", "#0284c7", "#7c3aed", "#db2777"];
const HEATMAP_COLORS = ["#e5e7eb", "#d1fae5", "#6ee7b7", "#10b981", "#047857"];

const THERAPISTS = [
    {
        name: "Dr. Priya Sharma",
        specialty: "Clinical Psychologist",
        clinic: "MindSpace Wellness Centre",
        address: "Koramangala, Bengaluru",
        phone: "+91 98400 11223",
        email: "priya@mindspacewellness.in",
        lang: "English, Hindi, Kannada",
        avatar: "P",
        color: "#10b981",
        experience: "9 Years Experience",
        fee: "₹1,200 / session",
        availability: "Mon–Sat, 10am–6pm",
        regNo: "RCI/KA/2015/04821",
        bio: "Dr. Priya specialises in anxiety, depression, and trauma using evidence-based CBT and mindfulness-based approaches. She offers both in-person and online sessions.",
        specializations: ["Anxiety", "Depression", "Trauma", "CBT", "Mindfulness"],
    },
    {
        name: "Dr. Arjun Mehta",
        specialty: "Psychiatrist & Therapist",
        clinic: "CalmPath Clinic",
        address: "Andheri West, Mumbai",
        phone: "+91 99100 44556",
        email: "arjun@calmpathclinic.com",
        lang: "English, Hindi, Marathi",
        avatar: "A",
        color: "#0284c7",
        experience: "14 Years Experience",
        fee: "₹1,800 / session",
        availability: "Tue–Sat, 11am–7pm",
        regNo: "MMC/MH/2010/11203",
        bio: "Dr. Arjun provides psychiatry and psychotherapy for mood disorders, OCD, and bipolar disorder. He takes a holistic, patient-first approach to mental wellness.",
        specializations: ["Mood Disorders", "OCD", "Bipolar", "Psychotherapy", "Medication Management"],
    },
    {
        name: "Dr. Sneha Iyer",
        specialty: "Counselling Psychologist",
        clinic: "SereneMind Therapy",
        address: "T. Nagar, Chennai",
        phone: "+91 88004 77889",
        email: "sneha@serenemind.in",
        lang: "English, Tamil, Telugu",
        avatar: "S",
        color: "#7c3aed",
        experience: "7 Years Experience",
        fee: "₹1,000 / session",
        availability: "Mon–Fri, 9am–5pm",
        regNo: "RCI/TN/2017/08831",
        bio: "Dr. Sneha focuses on relationship counselling, grief, and life transitions. Her warm, empathetic style helps clients build resilience and emotional clarity.",
        specializations: ["Relationships", "Grief", "Life Transitions", "Self-esteem", "Stress"],
    },
    {
        name: "Dr. Rohan Desai",
        specialty: "Cognitive Behavioural Therapist",
        clinic: "Equilibrium Centre",
        address: "Satellite, Ahmedabad",
        phone: "+91 91500 22334",
        email: "rohan@equilibriumctr.com",
        lang: "English, Hindi, Gujarati",
        avatar: "R",
        color: "#d97706",
        experience: "11 Years Experience",
        fee: "₹1,500 / session",
        availability: "Mon–Sat, 10am–7pm",
        regNo: "RCI/GJ/2013/06612",
        bio: "Dr. Rohan is an expert in CBT for phobias, panic disorder, and workplace stress. He brings a structured, goal-oriented approach to every session.",
        specializations: ["Phobias", "Panic Disorder", "Workplace Stress", "CBT", "Social Anxiety"],
    },
    {
        name: "Dr. Nidhi Kapoor",
        specialty: "Child & Adult Therapist",
        clinic: "Aasha Wellbeing Hub",
        address: "Sector 18, Noida",
        phone: "+91 93700 55667",
        email: "nidhi@aashawellbeing.in",
        lang: "English, Hindi",
        avatar: "N",
        color: "#db2777",
        experience: "10 Years Experience",
        fee: "₹1,300 / session",
        availability: "Mon–Fri, 10am–6pm",
        regNo: "RCI/UP/2014/09987",
        bio: "Dr. Nidhi works with children, adolescents, and adults dealing with ADHD, emotional dysregulation, and family conflict using play therapy and CBT.",
        specializations: ["ADHD", "Emotional Dysregulation", "Family Conflict", "Play Therapy", "Adolescents"],
    },
] as const;

type Therapist = typeof THERAPISTS[number];

export default function InsightsPage() {
    const { t, language } = useLanguage();

    const [userProfile, setUserProfile] = useState<{ name: string; email: string }>({ name: "", email: "" });
    const [trends, setTrends] = useState<any[]>([]);
    const [emotionDist, setEmotionDist] = useState<any[]>([]);
    const [activityHeatmap, setActivityHeatmap] = useState<any[]>([]);
    const [radarData, setRadarData] = useState<any[]>([]);
    const [wordCountTrend, setWordCountTrend] = useState<any[]>([]);
    const [overallScore, setOverallScore] = useState<number>(0);
    const [currentStreak, setCurrentStreak] = useState<number>(0);
    const [totalWords, setTotalWords] = useState<number>(0);
    const [recentEntries, setRecentEntries] = useState<any[]>([]);
    const [entryCount, setEntryCount] = useState<number>(0);
    const [insights, setInsights] = useState<Array<{ observation: string; actions: string[] }>>([]);
    const [therapistScore, setTherapistScore] = useState<{ score: number | null; justification: string | null }>({
        score: null,
        justification: null,
    });
    const [loading, setLoading] = useState(true);
    const [calculatingScore, setCalculatingScore] = useState(false);
    const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);

    const locale = language === "hi" ? "hi-IN" : "en-US";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createClient();
                const token = await getToken(supabase);
                if (!token) return;

                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (user) {
                    setUserProfile({
                        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
                        email: user.email || "",
                    });
                }

                const trendsRes = await fetch(`${API_BASE}/api/analytics/trends?days=30`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (trendsRes.ok) {
                    const data = await trendsRes.json();
                    setTrends(data.trends || []);
                    setEmotionDist(data.emotion_distribution || []);
                    setActivityHeatmap(data.activity_heatmap || []);
                    setRadarData(data.radar_data || []);
                    setWordCountTrend(data.word_count_trend || []);
                    setOverallScore(data.overall_score || 0);
                    setCurrentStreak(data.current_streak || 0);
                    setTotalWords(data.total_words || 0);
                    setRecentEntries(data.recent_entries || []);
                    setEntryCount(data.entry_count || 0);
                }

                const insightsRes = await fetch(`${API_BASE}/api/analytics/insights?language=${language}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (insightsRes.ok) {
                    const data = await insightsRes.json();
                    try {
                        const parsed = JSON.parse(data.insights || "[]");
                        setInsights(Array.isArray(parsed) ? parsed : []);
                    } catch {
                        setInsights([]);
                    }
                }

                const scoreRes = await fetch(`${API_BASE}/api/analytics/therapist-score`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (scoreRes.ok) {
                    const data = await scoreRes.json();
                    setTherapistScore({ score: data.therapist_score, justification: data.therapist_justification });
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
                toast.error(t.common.error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [language, t.common.error]);

    const handleCalculateScore = async () => {
        setCalculatingScore(true);
        const toastId = toast.loading(language === "hi" ? "स्कोर की गणना की जा रही है…" : "Calculating score…");
        try {
            const supabase = createClient();
            const token = await getToken(supabase);
            if (!token) throw new Error("No token");
            const res = await fetch(`${API_BASE}/api/analytics/therapist-score`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed");
            const data = await res.json();
            setTherapistScore({ score: data.therapist_score, justification: data.therapist_justification });
            toast.success(language === "hi" ? "स्कोर अपडेट किया गया" : "Score updated", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error(t.common.error, { id: toastId });
        } finally {
            setCalculatingScore(false);
        }
    };

    // Build heatmap grid (12 weeks = 84 days)
    const generateHeatmapGrid = () => {
        const today = new Date();
        const activityMap = new Map(activityHeatmap.map((a) => [a.date, a.count]));
        return Array.from({ length: 84 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (83 - i));
            const dateStr = d.toISOString().split("T")[0];
            const count = activityMap.get(dateStr) || 0;
            return { date: d, dateStr, count, level: count >= 4 ? 4 : count };
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-[#064e3b] animate-spin">progress_activity</span>
                    <p className="text-[#8ca69e] animate-pulse">{t.insights.analyzing}</p>
                </div>
            </div>
        );
    }

    const avgWords = entryCount > 0 ? Math.round(totalWords / entryCount) : 0;
    const heatmapGrid = generateHeatmapGrid();
    const topEmotion = emotionDist.length > 0 ? emotionDist[0].name : "Neutral";

    return (
        <div className="max-w-6xl mx-auto space-y-6 fade-in-up pb-12">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-[#8ca69e]/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#064e3b] to-[#10b981] flex items-center justify-center text-white text-2xl font-serif shadow-md flex-shrink-0">
                        {userProfile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xl font-serif text-[#064e3b]">{userProfile.name}</h1>
                        <p className="text-xs text-[#8ca69e] mb-3">{userProfile.email}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                                🔥 {currentStreak}-day streak
                            </span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 font-medium">
                                Mostly {topEmotion} this week
                            </span>
                            {language !== "en" && (
                                <span className="px-3 py-1 bg-purple-50 text-purple-800 rounded-full border border-purple-200 font-medium">
                                    {language === "hi" ? "Hindi" : language === "gu" ? "Gujarati" : "Hinglish"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-4xl font-light text-[#064e3b]">{entryCount}</p>
                    <p className="text-sm text-[#8ca69e]">Entries written</p>
                </div>
            </motion.div>

            {/* KPI Stats Row */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                {[
                    { value: overallScore, label: "Avg. Mood Score", sub: "↑ from last week" },
                    { value: currentStreak, label: "Day Streak", sub: "↑ Personal best" },
                    { value: avgWords, label: "Avg. Words/Entry", sub: "→ Consistent" },
                    { value: `${(totalWords / 1000).toFixed(1)}k`, label: "Total Words Written", sub: "↑ Growing" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/60 backdrop-blur-md rounded-xl p-5 border border-[#8ca69e]/20 shadow-sm">
                        <p className="text-3xl font-light text-[#064e3b] mb-1">{stat.value}</p>
                        <p className="text-xs text-[#8ca69e] leading-tight">{stat.label}</p>
                        <p className="text-[10px] text-emerald-600 mt-1">{stat.sub}</p>
                    </div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 30-Day Mood Trend */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-[#8ca69e]/20 shadow-sm"
                >
                    <h2 className="text-xs font-semibold text-[#8ca69e] tracking-widest uppercase mb-6">
                        {t.insights.moodTrends}
                    </h2>
                    <div className="h-[220px] w-full -ml-4">
                        {trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends}>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#8ca69e"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) =>
                                            new Date(v).toLocaleDateString(locale, { day: "numeric", month: "short" })
                                        }
                                    />
                                    <YAxis stroke="#8ca69e" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "10px",
                                            border: "none",
                                            boxShadow: "0 4px 24px 0 rgb(0 0 0 / 0.08)",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#064e3b"
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 5, fill: "#064e3b" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-[#8ca69e] text-center mt-20">{t.insights.noMoodData}</p>
                        )}
                    </div>
                </motion.div>

                {/* Emotion Distribution */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-[#8ca69e]/20 shadow-sm"
                >
                    <h2 className="text-xs font-semibold text-[#8ca69e] tracking-widest uppercase mb-2">
                        Emotion Distribution
                    </h2>
                    <div className="h-[240px] w-full relative">
                        {emotionDist.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={emotionDist}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {emotionDist.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-[#8ca69e] text-center mt-20">{t.insights.noEmotions}</p>
                        )}
                        {emotionDist.length > 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-2xl font-light text-[#064e3b]">{entryCount}</span>
                                <span className="text-[10px] text-[#8ca69e]">entries</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Journaling Activity Heatmap */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="md:col-span-2 bg-white/60 backdrop-blur-md rounded-xl p-6 border border-[#8ca69e]/20 shadow-sm"
                >
                    <h2 className="text-xs font-semibold text-[#8ca69e] tracking-widest uppercase mb-6">
                        {t.insights.activityHeatmap || "Journaling Activity — Last 12 Weeks"}
                    </h2>
                    <div className="flex">
                        {/* Day labels */}
                        <div className="flex flex-col justify-between text-[9px] text-[#8ca69e] pr-2 pb-1 pt-1 shrink-0">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Fri</span>
                            <span>Sun</span>
                        </div>
                        {/* Grid */}
                        <div className="flex gap-1 overflow-x-auto pb-2">
                            {Array.from({ length: 12 }).map((_, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col gap-1">
                                    {Array.from({ length: 7 }).map((_, dayIdx) => {
                                        const cellIndex = weekIdx * 7 + dayIdx;
                                        if (cellIndex >= 84) return null;
                                        const cell = heatmapGrid[cellIndex];
                                        if (!cell) return null;
                                        return (
                                            <div
                                                key={cellIndex}
                                                title={`${cell.dateStr}: ${cell.count} entries`}
                                                className="w-3.5 h-3.5 rounded-sm transition-[transform] cursor-pointer hover:scale-125"
                                                style={{ backgroundColor: HEATMAP_COLORS[cell.level] }}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-[10px] text-[#8ca69e]">
                        <span>{t.insights.less || "Less"}</span>
                        {HEATMAP_COLORS.map((c, i) => (
                            <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                        ))}
                        <span>{t.insights.more || "More"}</span>
                    </div>
                </motion.div>

                {/* Top Emotions Frequency Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-[#8ca69e]/20 shadow-sm"
                >
                    <h2 className="text-xs font-semibold text-[#8ca69e] tracking-widest uppercase mb-6">
                        {t.insights.topEmotions}
                    </h2>
                    <div className="space-y-3">
                        {emotionDist.slice(0, 6).map((emotion, idx) => {
                            const maxVal = emotionDist[0]?.value || 1;
                            const pct = (emotion.value / maxVal) * 100;
                            const barColors = ["#10b981", "#8b5cf6", "#f59e0b", "#3b82f6", "#ec4899", "#f97316"];
                            return (
                                <div key={idx} className="flex items-center gap-3">
                                    <span className="text-xs text-[#064e3b] w-20 truncate font-medium text-right shrink-0">
                                        {emotion.name}
                                    </span>
                                    <div className="flex-1 bg-[#f3f4f6] rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-[width] duration-700 ease-out"
                                            style={{ width: `${pct}%`, backgroundColor: barColors[idx % barColors.length] }}
                                        />
                                    </div>
                                    <span className="text-xs text-[#8ca69e] w-6 text-right shrink-0">{emotion.value}</span>
                                </div>
                            );
                        })}
                        {emotionDist.length === 0 && (
                            <p className="text-sm text-[#8ca69e]">{t.insights.noEmotions}</p>
                        )}
                    </div>
                </motion.div>

                {/* Emotional Wellness Radar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-[#8ca69e]/20 shadow-sm"
                >
                    <h2 className="text-xs font-semibold text-[#8ca69e] tracking-widest uppercase mb-2">
                        {t.insights.wellnessRadar || "Emotional Wellness Radar"}
                    </h2>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                <PolarGrid stroke="#8ca69e" strokeOpacity={0.25} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#064e3b", fontSize: 11 }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Wellness" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.35} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Word Count Trend */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-[#8ca69e]/20 shadow-sm"
                >
                    <h2 className="text-xs font-semibold text-[#8ca69e] tracking-widest uppercase mb-4">
                        {t.insights.wordCountTrend || "Word Count Per Entry"}
                    </h2>
                    <div className="h-[180px] w-full -ml-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={wordCountTrend}>
                                <defs>
                                    <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#db2777" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#db2777" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" hide />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 24px 0 rgb(0 0 0 / 0.08)", fontSize: "12px" }}
                                />
                                <Area type="monotone" dataKey="words" stroke="#db2777" strokeWidth={2} fillOpacity={1} fill="url(#colorWords)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-[#8ca69e]">
                        <span>Oldest</span>
                        <span>Avg: {avgWords} words</span>
                        <span>Newest</span>
                    </div>
                </motion.div>

                {/* Overall Wellness Score Gauge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-[#8ca69e]/20 shadow-sm flex flex-col items-center justify-center"
                >
                    <h2 className="text-xs font-semibold text-[#8ca69e] tracking-widest uppercase mb-8 self-start">
                        {t.insights.overallWellness || "Overall Wellness Score"}
                    </h2>

                    {/* SVG Gauge */}
                    <div className="relative w-48 h-28 flex items-end justify-center">
                        <svg viewBox="0 0 200 110" className="w-full h-full" style={{ overflow: "visible" }}>
                            {/* Track */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="16"
                                strokeLinecap="round"
                            />
                            {/* Fill */}
                            <path
                                d="M 20 100 A 80 80 0 0 1 180 100"
                                fill="none"
                                stroke="#064e3b"
                                strokeWidth="16"
                                strokeLinecap="round"
                                strokeDasharray={`${(overallScore / 10) * 251.2} 251.2`}
                                style={{ transition: "stroke-dasharray 1s ease-out" }}
                            />
                            <text x="100" y="95" textAnchor="middle" className="text-4xl" fontSize="32" fill="#064e3b" fontWeight="300">
                                {overallScore}
                            </text>
                            <text x="100" y="110" textAnchor="middle" fontSize="11" fill="#8ca69e">
                                {t.insights.outOf10 || "out of 10"}
                            </text>
                        </svg>
                    </div>

                    <div className="flex justify-between w-40 mt-6 text-xs font-medium">
                        <span className="text-[#10b981]">{t.insights.best || "Best"}: 10.0</span>
                        <span className="text-[#8ca69e]">{t.insights.lowest || "Lowest"}: 0.0</span>
                    </div>
                </motion.div>
            </div>

            {/* AI Insights Card */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="bg-gradient-to-br from-emerald-50/80 to-amber-50/60 rounded-xl p-6 border border-emerald-200/60 shadow-sm"
            >
                <h2 className="text-sm font-semibold text-[#064e3b] mb-5 flex items-center gap-2 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[18px]">psychology_alt</span>
                    {t.insights.aiTitle || "AI Insights — Based on your last 10 entries"}
                </h2>

                <div className="space-y-4">
                    {insights.length > 0 ? (
                        insights.map((item, i) => (
                            <div
                                key={i}
                                className="bg-white/70 rounded-xl border border-emerald-100 overflow-hidden shadow-sm"
                            >
                                {/* Observation */}
                                <div className="flex items-start gap-3 p-4 relative">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#10b981] to-[#d97706] rounded-r-full" />
                                    <div className="pl-2">
                                        <p className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mb-1.5">Observation</p>
                                        <p className="text-sm text-[#1a3a2a] leading-relaxed">{item.observation}</p>
                                    </div>
                                </div>
                                {/* Actions */}
                                {item.actions?.length > 0 && (
                                    <div className="px-5 pb-4 pt-3 border-t border-emerald-100/80 bg-amber-50/40">
                                        <p className="text-[10px] font-bold text-[#d97706] uppercase tracking-widest mb-2.5">Actions you may take</p>
                                        <ul className="space-y-2">
                                            {item.actions.map((action, ai) => (
                                                <li key={ai} className="flex items-start gap-2.5 text-sm text-[#2d5a3d]">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#d97706] flex-shrink-0" />
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-[#8ca69e] text-sm italic py-4">{t.insights.noInsights}</p>
                    )}
                </div>

                <div className="mt-5 pt-4 border-t border-emerald-200/60 flex items-center gap-2 text-xs text-[#8ca69e]">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    {t.insights.aiFooter}
                </div>
            </motion.div>

            {/* Recent Journal Entries */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-white/60 backdrop-blur-md rounded-xl border border-[#8ca69e]/20 shadow-sm overflow-hidden"
            >
                <div className="p-6 pb-4">
                    <h2 className="text-xs font-semibold text-[#8ca69e] tracking-widest uppercase">
                        {t.insights.recentEntriesTitle || "Recent Journal Entries"}
                    </h2>
                </div>
                <div className="divide-y divide-[#8ca69e]/10">
                    {recentEntries.length > 0 ? (
                        recentEntries.map((entry, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 hover:bg-[#8ca69e]/5 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${entry.score > 7 ? "bg-emerald-400" : entry.score > 4 ? "bg-amber-400" : "bg-rose-400"}`}
                                    />
                                    <div>
                                        <h3 className="text-sm font-medium text-[#064e3b] mb-1">{entry.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-[#8ca69e]">
                                            <span>{entry.date}</span>
                                            <span>·</span>
                                            <span>{entry.word_count} {t.insights.words || "words"}</span>
                                            <span>·</span>
                                            <span>{t.insights.score || "Score:"} {entry.score}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3 md:mt-0 ml-6 md:ml-0 flex-wrap">
                                    {entry.tags.map((tag: string, tidx: number) => (
                                        <span
                                            key={tidx}
                                            className="px-2.5 py-0.5 rounded-full bg-[#064e3b]/8 text-[#064e3b] text-[10px] uppercase tracking-wide font-medium border border-[#064e3b]/10"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-[#8ca69e] italic px-6 py-4">No recent entries found.</p>
                    )}
                </div>
            </motion.div>

            {/* Therapist Score Card */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 }}
                className="bg-red-50/60 backdrop-blur-sm border border-red-100 rounded-xl p-6 shadow-sm"
            >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h2 className="text-xs font-semibold text-red-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">health_and_safety</span>
                            {language === "hi" ? "थेरेपिस्ट आवश्यकता स्कोर" : "Therapist Need Score"}
                        </h2>
                        <p className="text-sm text-red-600/80 max-w-2xl">
                            {language === "hi"
                                ? "एआई द्वारा आपके हाल के जर्नल्स का विश्लेषण करके 0-100 का स्कोर दिया जाता है।"
                                : "AI-computed score from 0-100 based on your recent 14 days of entries (0 = Perfect health, 100 = High distress)."}
                        </p>

                        {therapistScore.score !== null && (
                            <div className="mt-4">
                                <div className="flex items-end gap-3 mb-2">
                                    <span
                                        className={`text-4xl font-semibold ${therapistScore.score > 75 ? "text-red-700" : therapistScore.score > 50 ? "text-amber-600" : "text-[#064e3b]"}`}
                                    >
                                        {therapistScore.score}/100
                                    </span>
                                    {therapistScore.score > 75 && (
                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-md mb-1 font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">warning</span>
                                            {language === "hi" ? "पेशेवर मदद लें" : "Seek Professional Help"}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-red-900/80 italic border-l-2 border-red-300 pl-3 py-1">
                                    "{therapistScore.justification}"
                                </p>
                            </div>
                        )}

                        {therapistScore.score === null && (
                            <p className="text-sm text-red-400 mt-4 italic">
                                {language === "hi" ? "कोई स्कोर उपलब्ध नहीं है।" : "No score available yet."}
                            </p>
                        )}
                    </div>

                    <div className="flex-shrink-0">
                        <button
                            onClick={handleCalculateScore}
                            disabled={calculatingScore}
                            className="px-5 py-2.5 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-[background-color] disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                            <span className={`material-symbols-outlined text-base ${calculatingScore ? "animate-spin" : ""}`}>
                                {calculatingScore ? "sync" : "calculate"}
                            </span>
                            {language === "hi" ? "स्कोर की गणना करें" : "Calculate Score"}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Therapist Referral Cards — shown only when score > 60 */}
            {therapistScore.score !== null && therapistScore.score > 60 && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85 }}
                    className="space-y-5"
                >
                    {/* Section header */}
                    <div className="flex items-center gap-3 px-1">
                        <div className="flex-1 h-px bg-red-200/60" />
                        <div className="flex items-center gap-2 text-xs font-semibold text-red-700 uppercase tracking-widest whitespace-nowrap">
                            <span className="material-symbols-outlined text-sm">medical_services</span>
                            {language === "hi" ? "हमारे साथी मानसिक स्वास्थ्य विशेषज्ञ" : "Our Partner Mental Health Specialists"}
                        </div>
                        <div className="flex-1 h-px bg-red-200/60" />
                    </div>

                    <p className="text-sm text-[#8ca69e] text-center">
                        {language === "hi"
                            ? "आपके स्कोर के आधार पर हम इन विशेषज्ञों से संपर्क करने की सलाह देते हैं।"
                            : "Based on your score, we recommend reaching out to one of our partner therapists for professional support."}
                    </p>

                    {/* ── Referral Code Banner ── */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 to-amber-50 border-2 border-dashed border-[#10b981]/40 rounded-xl px-6 py-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#10b981] text-2xl">local_offer</span>
                            <div>
                                <p className="text-xs font-bold text-[#064e3b] uppercase tracking-widest">
                                    {language === "hi" ? "आपका विशेष रेफरल कोड" : "Your Exclusive Referral Code"}
                                </p>
                                <p className="text-[11px] text-[#8ca69e] mt-0.5">
                                    {language === "hi"
                                        ? "क्लिनिक पर यह कोड दिखाएं और 15–20% की छूट पाएं"
                                        : "Show this code at the clinic to receive 15–20% off your first session"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white border border-[#10b981]/30 rounded-lg px-5 py-2.5 shadow-sm flex-shrink-0">
                            <span className="text-xl font-black tracking-widest text-[#064e3b]" style={{ fontFamily: "monospace" }}>EmoDiary</span>
                            <button
                                onClick={() => { navigator.clipboard?.writeText("EmoDiary"); }}
                                className="text-[#8ca69e] hover:text-[#064e3b] transition-colors"
                                title="Copy code"
                            >
                                <span className="material-symbols-outlined text-base">content_copy</span>
                            </button>
                        </div>
                    </div>

                    {/* ── Therapist Cards ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {THERAPISTS.map((doc, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedTherapist(doc)}
                                className="bg-white/70 backdrop-blur-md rounded-xl border border-[#8ca69e]/20 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-[#10b981]/40 transition-[box-shadow,border-color] text-left group"
                            >
                                {/* Avatar + Name */}
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                        style={{ backgroundColor: doc.color }}
                                    >
                                        {doc.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#064e3b] leading-tight truncate">{doc.name}</p>
                                        <p className="text-[11px] text-[#8ca69e]">{doc.specialty}</p>
                                    </div>
                                    <span className="material-symbols-outlined text-[#8ca69e] text-base opacity-0 group-hover:opacity-100 transition-opacity">open_in_full</span>
                                </div>

                                {/* Clinic info */}
                                <div className="space-y-1.5 text-xs text-[#4a6e5a]">
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[14px] text-[#8ca69e] flex-shrink-0 mt-0.5">apartment</span>
                                        <span>{doc.clinic}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[14px] text-[#8ca69e] flex-shrink-0 mt-0.5">location_on</span>
                                        <span>{doc.address}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="material-symbols-outlined text-[14px] text-[#8ca69e] flex-shrink-0 mt-0.5">translate</span>
                                        <span>{doc.lang}</span>
                                    </div>
                                </div>

                                {/* Fee pill */}
                                <div className="flex items-center justify-between pt-1 border-t border-[#8ca69e]/10">
                                    <span className="text-[11px] font-semibold text-[#064e3b]">{doc.fee}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-[#10b981] border border-emerald-100 font-medium">View details →</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <p className="text-center text-[10px] text-[#8ca69e]/60 pt-2">
                        {language === "hi"
                            ? "emoDiary किसी भी समय आपकी मदद के लिए यहाँ है। ये संपर्क विवरण सामान्य जानकारी के लिए हैं।"
                            : "emoDiary is here for you. Therapist listings are for informational purposes only."}
                    </p>
                </motion.div>
            )}

            {/* ── Therapist Detail Modal ── */}
            {selectedTherapist && typeof window !== "undefined" && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setSelectedTherapist(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                    >
                        {/* Modal header */}
                        <div className="p-6 pb-4" style={{ background: `linear-gradient(135deg, ${selectedTherapist.color}18, ${selectedTherapist.color}08)` }}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md"
                                        style={{ backgroundColor: selectedTherapist.color }}
                                    >
                                        {selectedTherapist.avatar}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-[#064e3b]">{selectedTherapist.name}</h3>
                                        <p className="text-xs text-[#8ca69e] mt-0.5">{selectedTherapist.specialty}</p>
                                        <p className="text-xs font-semibold mt-1" style={{ color: selectedTherapist.color }}>{selectedTherapist.experience}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedTherapist(null)} className="text-[#8ca69e] hover:text-[#064e3b] transition-colors p-1">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal body */}
                        <div className="px-6 pb-6 space-y-4">
                            {/* About */}
                            <p className="text-sm text-[#4a6e5a] leading-relaxed">{selectedTherapist.bio}</p>

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: "apartment", label: "Clinic", value: selectedTherapist.clinic },
                                    { icon: "location_on", label: "Location", value: selectedTherapist.address },
                                    { icon: "translate", label: "Languages", value: selectedTherapist.lang },
                                    { icon: "schedule", label: "Availability", value: selectedTherapist.availability },
                                    { icon: "payments", label: "Session Fee", value: selectedTherapist.fee },
                                    { icon: "verified", label: "Registration", value: selectedTherapist.regNo },
                                ].map((item, i) => (
                                    <div key={i} className="bg-[#f8faf9] rounded-lg p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="material-symbols-outlined text-[12px] text-[#8ca69e]">{item.icon}</span>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-[#8ca69e]">{item.label}</p>
                                        </div>
                                        <p className="text-xs font-semibold text-[#064e3b] leading-snug">{item.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Specializations */}
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8ca69e] mb-2">Specializations</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTherapist.specializations.map((s, i) => (
                                        <span key={i} className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-[#064e3b] border border-emerald-100 font-medium">{s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Referral code reminder */}
                            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                <span className="material-symbols-outlined text-amber-600 text-lg">local_offer</span>
                                <div>
                                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Use referral code for 15–20% off</p>
                                    <p className="text-base font-black tracking-widest text-amber-900" style={{ fontFamily: "monospace" }}>EmoDiary</p>
                                </div>
                            </div>

                            {/* CTA buttons */}
                            <div className="flex gap-2 pt-1">
                                <a
                                    href={`tel:${selectedTherapist.phone.replace(/\s/g, "")}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#064e3b] text-white text-xs font-semibold hover:bg-[#0a7c5c] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">call</span>
                                    Call Now
                                </a>
                                <a
                                    href={`mailto:${selectedTherapist.email}?subject=Appointment Request — emoDiary Referral (EmoDiary)`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#8ca69e]/30 text-[#8ca69e] text-xs font-semibold hover:bg-[#8ca69e]/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">mail</span>
                                    Email
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}


        </div>
    );
}
