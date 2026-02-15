// [FILENAME: src/app/(protected)/insights/page.tsx]
// [PURPOSE: Analytics dashboard showing mood trends and AI insights]
// [DEPENDENCIES: recharts, lucide-react, framer-motion, @/lib/api]
// [PHASE: Phase 7 - Analytics]

"use client";

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/language-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#0088FE", "#8884d8"];

export default function InsightsPage() {
    const { t, language } = useLanguage();
    const [trends, setTrends] = useState<any[]>([]);
    const [emotionDist, setEmotionDist] = useState<any[]>([]);
    const [insights, setInsights] = useState<string>("");
    const [loading, setLoading] = useState(true);

    const locale = language === 'hi' ? 'hi-IN' : 'en-US';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;

                if (!token) return;

                // Fetch Trends
                const trendsRes = await fetch(`${API_BASE}/api/analytics/trends?days=30`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (trendsRes.ok) {
                    const data = await trendsRes.json();
                    setTrends(data.trends);
                    setEmotionDist(data.emotion_distribution);
                }

                // Fetch AI Insights
                const insightsRes = await fetch(`${API_BASE}/api/analytics/insights?language=${language}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (insightsRes.ok) {
                    const data = await insightsRes.json();
                    setInsights(data.insights);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-4xl text-[#064e3b] animate-spin">
                        progress_activity
                    </span>
                    <p className="text-[#8ca69e] animate-pulse">{t.insights.analyzing}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 fade-in-up pb-12">
            <header className="mb-8">
                <h1 className="serif-text text-3xl font-light text-[#064e3b]">{t.insights.title}</h1>
                <p className="text-[#8ca69e] mt-2">
                    {t.insights.subtitle}
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mood Trends Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-2 bg-white/60 backdrop-blur-sm border border-[#8ca69e]/20 rounded-xl p-6 shadow-sm"
                >
                    <h2 className="text-lg font-medium text-[#064e3b] mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">ssid_chart</span>
                        {t.insights.moodTrends}
                    </h2>
                    <div className="h-[300px] w-full">
                        {trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#8ca69e20" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#8ca69e"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis
                                        stroke="#8ca69e"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[0, 10]}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#064e3b"
                                        strokeWidth={2}
                                        dot={{ fill: "#064e3b", strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[#8ca69e]">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">show_chart</span>
                                <p>{t.insights.noMoodData}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Emotion Distribution */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/60 backdrop-blur-sm border border-[#8ca69e]/20 rounded-xl p-6 shadow-sm"
                >
                    <h2 className="text-lg font-medium text-[#064e3b] mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined">donut_large</span>
                        {t.insights.topEmotions}
                    </h2>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        {emotionDist.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={emotionDist}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {emotionDist.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-[#8ca69e]">
                                <p>{t.insights.noEmotions}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* AI Insights Card */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-[#064e3b] to-[#0f766e] rounded-xl p-6 shadow-lg text-[#fefcfa]"
                >
                    <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined">psychology_alt</span>
                        {t.insights.aiTitle}
                    </h2>
                    <div className="prose prose-invert prose-sm max-w-none">
                        {insights ? (
                            <div className="space-y-3 leading-relaxed opacity-90">
                                {insights.split('\n').map((line, i) => (
                                    line.trim() && <p key={i} className="flex gap-2">
                                        <span className="opacity-50 mt-1.5">•</span>
                                        <span>{line.replace(/^-\s*/, '').replace(/^\*\s*/, '')}</span>
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className="opacity-70 italic">
                                {t.insights.noInsights}
                            </p>
                        )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs opacity-60">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        {t.insights.aiFooter}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
