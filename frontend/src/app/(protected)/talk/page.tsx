"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";
import { AvatarHead, AvatarConfig } from "@/components/avatar/AvatarHead";

interface Message {
    id?: string;
    role: "user" | "assistant";
    content: string;
    created_at?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type VoiceState = "idle" | "listening" | "processing" | "speaking";

const DEFAULT_AVATAR: AvatarConfig = {
    skin: "warm",
    hair: "black",
    headShape: "round",
    accentColor: "#10b981",
};

export default function TalkPage() {
    const router = useRouter();
    const { t, language, setLanguage } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [starting, setStarting] = useState(false);
    const [ending, setEnding] = useState(false);
    const [showSavePrompt, setShowSavePrompt] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Avatar state
    const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
    const [avatarName, setAvatarName] = useState("emoDiary");
    const [userDisplayName, setUserDisplayName] = useState("You");

    // Lip sync
    const [lipSyncValue, setLipSyncValue] = useState(0);
    const lipSyncRafRef = useRef<number | null>(null);
    const lipSyncAnalyserRef = useRef<AnalyserNode | null>(null);
    const lipSyncCtxRef = useRef<AudioContext | null>(null);

    // Voice
    const [voiceState, setVoiceState] = useState<VoiceState>("idle");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const silenceStartRef = useRef<number | null>(null);
    const vadFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    // Load avatar config on mount
    useEffect(() => {
        async function loadAvatar() {
            try {
                const token = await getToken();
                const res = await fetch(`${API_BASE}/api/profile/avatar`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAvatarConfig(data.avatar_config ?? DEFAULT_AVATAR);
                    setAvatarName(data.avatar_name ?? "emoDiary");
                }
            } catch { /* use defaults */ }
        }

        async function loadUser() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "You";
                setUserDisplayName(name.split(" ")[0]);
            }
        }

        loadAvatar();
        loadUser();
    }, []);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const getToken = async () => {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || "";
    };

    // ─── Lip Sync Engine ───────────────────────────────────────────
    const startLipSync = (audioEl: HTMLAudioElement) => {
        stopLipSync();
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            lipSyncCtxRef.current = ctx;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            lipSyncAnalyserRef.current = analyser;

            const source = ctx.createMediaElementSource(audioEl);
            source.connect(analyser);
            analyser.connect(ctx.destination);

            const buf = new Uint8Array(analyser.frequencyBinCount);

            const tick = () => {
                analyser.getByteTimeDomainData(buf);
                // RMS amplitude
                let sumSq = 0;
                for (let i = 0; i < buf.length; i++) {
                    const n = (buf[i] - 128) / 128;
                    sumSq += n * n;
                }
                const rms = Math.sqrt(sumSq / buf.length);
                setLipSyncValue(Math.min(rms * 4, 1)); // scale up sensitivity
                lipSyncRafRef.current = requestAnimationFrame(tick);
            };
            lipSyncRafRef.current = requestAnimationFrame(tick);
        } catch (e) {
            console.warn("Lip sync not available:", e);
        }
    };

    const stopLipSync = () => {
        if (lipSyncRafRef.current) {
            cancelAnimationFrame(lipSyncRafRef.current);
            lipSyncRafRef.current = null;
        }
        setLipSyncValue(0);
        if (lipSyncCtxRef.current) {
            lipSyncCtxRef.current.close().catch(() => {});
            lipSyncCtxRef.current = null;
        }
    };

    // ─── Session ───────────────────────────────────────────────────
    const startSession = async () => {
        setStarting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/chat/session`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ language }),
            });
            if (!res.ok) throw new Error("Failed to start session");
            const data = await res.json();
            setSessionId(data.session_id);
            setMessages([{ role: "assistant", content: data.greeting }]);
            toast.success(language === "en" ? "Session started" : "सत्र शुरू हो गया");
            setTimeout(() => inputRef.current?.focus(), 100);
        } catch (error) {
            console.error("Failed to start session:", error);
            toast.error(t.common.error);
        } finally {
            setStarting(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !sessionId || loading || voiceState !== "idle") return;
        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/chat/message`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage, session_id: sessionId, language }),
            });
            if (!res.ok) throw new Error("Failed to send message");
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
            setLoading(false);

            if (data.audio_base64) {
                const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
                currentAudioRef.current = audio;
                setVoiceState("speaking");
                audio.onended = () => {
                    stopLipSync();
                    setVoiceState("idle");
                };
                startLipSync(audio);
                audio.play().catch(e => {
                    stopLipSync();
                    setVoiceState("idle");
                });
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error(t.common.error);
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ─── Voice Loop ───────────────────────────────────────────────
    const cleanupVoiceResources = () => {
        stopLipSync();
        if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
            audioContextRef.current = null;
        }
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
    };

    const startListeningLoop = async () => {
        if (!sessionId) return;
        cleanupVoiceResources();
        setVoiceState("listening");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                if (audioChunksRef.current.length > 0 && streamRef.current !== null) {
                    sendVoiceMessage(audioBlob);
                }
            };

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioContext = new AudioContextClass();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.minDecibels = -60;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            silenceStartRef.current = null;
            const checkSilence = () => {
                if (mediaRecorder.state !== "recording") return;
                analyser.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                const average = sum / bufferLength;

                if (average > 5) {
                    silenceStartRef.current = null;
                } else {
                    if (silenceStartRef.current === null) {
                        silenceStartRef.current = Date.now();
                    } else if (Date.now() - silenceStartRef.current > 3000) {
                        mediaRecorder.stop();
                        if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
                        return;
                    }
                }
                vadFrameRef.current = requestAnimationFrame(checkSilence);
            };

            mediaRecorder.start();
            vadFrameRef.current = requestAnimationFrame(checkSilence);
        } catch (error) {
            console.error("Error accessing mic:", error);
            setVoiceState("idle");
            toast.error("Microphone access denied. Please check permissions.");
        }
    };

    const stopContinuousVoice = () => {
        setVoiceState("idle");
        cleanupVoiceResources();
    };

    const sendVoiceMessage = async (audioBlob: Blob) => {
        if (!sessionId) return;
        setVoiceState("processing");

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("session_id", sessionId);
        formData.append("language", language);

        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/chat/voice`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) throw new Error("Voice processing failed");

            const data = await res.json();
            if (data.user_transcript?.trim().length > 0) {
                setMessages((prev) => [...prev, { role: "user", content: data.user_transcript }]);
            }
            if (data.ai_response?.trim().length > 0) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.ai_response }]);
            }

            if (data.ai_audio) {
                setVoiceState("speaking");
                const audio = new Audio(`data:audio/wav;base64,${data.ai_audio}`);
                currentAudioRef.current = audio;

                audio.onended = () => {
                    stopLipSync();
                    setVoiceState((current) => {
                        if (current === "speaking") {
                            setTimeout(startListeningLoop, 100);
                            return "listening";
                        }
                        return current;
                    });
                };

                startLipSync(audio);
                audio.play().catch(e => {
                    console.error("Audio playback blocked", e);
                    stopLipSync();
                    setVoiceState("idle");
                });
            } else {
                setVoiceState((current) => {
                    if (current === "processing") {
                        setTimeout(startListeningLoop, 100);
                        return "listening";
                    }
                    return current;
                });
            }
        } catch (error) {
            console.error("Voice message failed:", error);
            setVoiceState((current) => {
                if (current === "processing") {
                    setTimeout(startListeningLoop, 100);
                    return "listening";
                }
                return current;
            });
        }
    };

    const handleEndSessionClick = () => {
        if (!sessionId) return;
        stopContinuousVoice();
        if (messages.length > 1) {
            setShowSavePrompt(true);
        } else {
            endSession(false);
        }
    };

    const endSession = async (saveAsJournal: boolean) => {
        if (!sessionId) return;
        setEnding(true);
        setShowSavePrompt(false);
        try {
            const token = await getToken();
            await fetch(`${API_BASE}/api/chat/session/${sessionId}/end`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (saveAsJournal) {
                const toastId = toast.loading(language === "hi" ? "जर्नल में बदल रहे हैं…" : "Converting to Journal…");
                const res = await fetch(`${API_BASE}/api/chat/session/${sessionId}/convert_to_journal`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    toast.success(language === "hi" ? "जर्नल के रूप में सहेजा गया!" : "Saved as Journal Entry!", { id: toastId });
                    setSessionId(null);
                    setMessages([]);
                    router.push("/journal");
                    return;
                } else {
                    toast.error(language === "hi" ? "सहेजने में विफल" : "Failed to convert", { id: toastId });
                }
            } else {
                toast.success(language === "hi" ? "बातचीत समाप्त हुई" : "Conversation ended");
            }
            setSessionId(null);
            setMessages([]);
        } catch (error) {
            console.error("Failed to end session:", error);
            toast.error(t.common.error);
        } finally {
            setEnding(false);
        }
    };

    const isBusy = loading || voiceState === "processing" || voiceState === "speaking";

    const getStatusText = () => {
        if (voiceState === "listening") return t.talk.listening || "Listening…";
        if (voiceState === "processing") return t.talk.processing || "Thinking…";
        if (voiceState === "speaking") return t.talk.speaking || "Speaking…";
        if (loading) return t.talk.processing || "Typing…";
        return "";
    };

    // ─── Pre-session landing ───────────────────────────────────────
    if (!sessionId) {
        return (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 fade-in-up">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#064e3b]/20 blur-3xl rounded-full" />
                    <div className="relative z-10">
                        <AvatarHead
                            config={avatarConfig}
                            name={avatarName}
                            lipSyncValue={0}
                            size={160}
                        />
                    </div>
                </div>

                <div className="space-y-4 max-w-md">
                    <h1 className="serif-text text-4xl font-light text-[#064e3b]">{t.talk.title}</h1>
                    <p className="text-[#8ca69e] text-lg font-light leading-relaxed">{t.talk.subtitle}</p>
                </div>

                {/* Language Toggle */}
                <div className="flex bg-[#8ca69e]/10 p-1 rounded-full flex-wrap gap-1">
                    {[
                        { id: "en", label: "English" },
                        { id: "hi", label: "हिंदी" },
                        { id: "hinglish", label: "Hinglish" },
                        { id: "gu", label: "ગુજરાતી" },
                    ].map((lang) => (
                        <button
                            key={lang.id}
                            onClick={() => setLanguage(lang.id as any)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-[background-color,box-shadow,color] ${language === lang.id ? "bg-white shadow text-[#064e3b]" : "text-[#8ca69e] hover:text-[#064e3b]"}`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={startSession}
                        disabled={starting}
                        className="group relative px-8 py-4 bg-[#064e3b] text-[#fefcfa] rounded-full font-medium text-lg shadow-lg hover:shadow-xl hover:shadow-[#064e3b]/20 transition-[background-color,box-shadow,transform] hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <span className="flex items-center gap-2">
                            {starting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    {t.common.loading}
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">mic</span>
                                    {t.talk.title}
                                </>
                            )}
                        </span>
                    </button>
                </div>

                <p className="text-xs text-[#8ca69e]/60 mt-8">Your conversations are private and secure.</p>
            </div>
        );
    }

    // ─── Active Session — 50/50 Split ────────────────────────────
    return (
        <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col fade-in-up">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#8ca69e]/10 bg-white/50 backdrop-blur-sm rounded-t-xl">
                <div className="flex items-center gap-3">
                    {voiceState !== "idle" || loading ? (
                        <>
                            <div className={`w-2 h-2 rounded-full ${voiceState === "listening" ? "bg-red-500" : "bg-green-500"} animate-pulse`} />
                            <span className="text-sm font-medium text-[#064e3b]">{getStatusText()}</span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-[#8ca69e]/40" />
                            <span className="text-sm text-[#8ca69e]">Idle</span>
                        </>
                    )}
                </div>
                <button
                    onClick={handleEndSessionClick}
                    disabled={ending}
                    className="text-xs text-[#8ca69e] hover:text-rose-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
                >
                    {ending ? t.journal.saving : "End Session"}
                </button>
            </div>

            {/* 50/50 Avatar Area */}
            <div className="grid grid-cols-2 border-b border-[#8ca69e]/10 bg-gradient-to-b from-[#f8faf9] to-white">
                {/* Left — User Panel */}
                <div className="flex flex-col items-center justify-center py-8 px-4 border-r border-[#8ca69e]/10">
                    {/* User avatar badge */}
                    <div className="flex flex-col items-center gap-3">
                        <div
                            className={`w-24 h-24 rounded-full bg-gradient-to-br from-[#8ca69e]/30 to-[#064e3b]/20 flex items-center justify-center text-3xl font-serif text-[#064e3b] shadow-md transition-[transform,ring-width] duration-300 ${voiceState === "listening" ? "ring-4 ring-red-400 ring-offset-2 scale-105" : ""}`}
                        >
                            {userDisplayName.charAt(0).toUpperCase()}
                        </div>
                        {/* Name */}
                        <div className="px-3 py-1 rounded-full text-xs font-semibold bg-[#8ca69e]/10 border border-[#8ca69e]/20 text-[#064e3b]">
                            {userDisplayName}
                        </div>
                        {/* Voice rings when listening */}
                        {voiceState === "listening" && (
                            <div className="flex items-center gap-1 mt-2">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-red-500 rounded-full animate-bounce"
                                        style={{
                                            height: `${8 + Math.random() * 16}px`,
                                            animationDelay: `${i * 0.1}s`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                        {voiceState !== "listening" && (
                            <p className="text-xs text-[#8ca69e] mt-1">
                                {voiceState === "processing" ? "Processing…" : "Your turn…"}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right — AI Avatar Panel */}
                <div className="flex flex-col items-center justify-center py-8 px-4">
                    <AvatarHead
                        config={avatarConfig}
                        name={avatarName}
                        lipSyncValue={lipSyncValue}
                        size={140}
                        isSpeaking={voiceState === "speaking"}
                    />
                    {voiceState === "speaking" && (
                        <p className="text-xs text-[#10b981] mt-3 animate-pulse font-medium">
                            {avatarName} is speaking…
                        </p>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide`}>
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                            className={`max-w-[78%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                                    ? "bg-[#064e3b] text-[#fefcfa] rounded-br-none"
                                    : "bg-white border border-[#8ca69e]/20 text-foreground rounded-bl-none"
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {(loading || voiceState === "processing") && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-[#8ca69e]/20 rounded-2xl px-5 py-3.5 rounded-bl-none flex gap-1 items-center h-[46px]">
                            <div className="w-1.5 h-1.5 bg-[#8ca69e]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-[#8ca69e]/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-[#8ca69e]/40 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-[#8ca69e]/10 rounded-b-xl">
                <div className="relative flex items-end gap-2 bg-white border border-[#8ca69e]/20 rounded-2xl p-2 shadow-sm focus-within:border-[#8ca69e]/40 transition-[border-color,box-shadow]">
                    <button
                        onClick={voiceState !== "idle" ? stopContinuousVoice : startListeningLoop}
                        className={`p-3 rounded-xl transition-[background-color,color,box-shadow] ${voiceState !== "idle"
                                ? "bg-red-50 text-red-600 hover:bg-red-100 shadow-inner"
                                : "text-[#8ca69e] hover:bg-[#8ca69e]/10 hover:text-[#064e3b]"
                            }`}
                        aria-label={voiceState !== "idle" ? "Stop Live Voice" : "Start Live Voice"}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {voiceState !== "idle" ? "stop_circle" : "mic"}
                        </span>
                    </button>

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        name="message"
                        autoComplete="off"
                        disabled={voiceState !== "idle" || loading}
                        placeholder={voiceState !== "idle" ? getStatusText() : "Share what's on your mind…"}
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-sm placeholder:text-[#8ca69e]/50 disabled:opacity-50"
                        rows={1}
                        style={{ minHeight: "44px", maxHeight: "120px" }}
                    />

                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isBusy}
                        className="p-3 rounded-xl bg-[#064e3b] text-[#fefcfa] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0a7c5c] transition-colors shadow-sm"
                        aria-label="Send message"
                    >
                        <span className="material-symbols-outlined text-xl">send</span>
                    </button>
                </div>
                <p className="text-center text-[10px] text-[#8ca69e]/40 mt-2">
                    {voiceState !== "idle" ? "Hands-free continuous mode is active." : "AI can make mistakes. Consider checking important information."}
                </p>
            </div>

            {/* Save Prompt Modal */}
            {showSavePrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-[#fefcfa] rounded-xl border border-[#8ca69e]/20 p-8 max-w-sm w-full shadow-2xl fade-in-up">
                        <div className="text-center space-y-4">
                            <span className="material-symbols-outlined text-4xl text-[#064e3b] mb-2">import_contacts</span>
                            <h3 className="serif-text text-xl font-medium">
                                {language === "hi" ? "इस बातचीत को जर्नल में बदलें?" : "Convert to Journal?"}
                            </h3>
                            <p className="text-sm text-[#8ca69e] leading-relaxed">
                                {language === "hi"
                                    ? "हम इस बातचीत का सारांश तैयार करके इसे आपकी डायरी में नए टैग्स के साथ सेव कर सकते हैं।"
                                    : "We can summarize this conversation and save it to your diary with AI generated tags."}
                            </p>
                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={() => endSession(true)}
                                    disabled={ending}
                                    className="w-full px-4 py-3 rounded-lg bg-[#064e3b] text-[#fefcfa] text-sm font-medium hover:bg-[#086a51] transition-colors disabled:opacity-50"
                                >
                                    {ending ? "Saving…" : (language === "hi" ? "हाँ, डायरी में सहेजें" : "Yes, save to Diary")}
                                </button>
                                <button
                                    onClick={() => endSession(false)}
                                    disabled={ending}
                                    className="w-full px-4 py-3 rounded-lg border border-[#8ca69e]/20 text-[#8ca69e] text-sm font-medium hover:bg-[#8ca69e]/10 transition-colors"
                                >
                                    {language === "hi" ? "नहीं, बस छोड़ दें" : "No, just discard"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
