"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";

interface Message {
    id?: string;
    role: "user" | "assistant";
    content: string;
    created_at?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function TalkPage() {
    const { t, language, setLanguage } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [starting, setStarting] = useState(false);
    const [ending, setEnding] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

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

    const startSession = async () => {
        setStarting(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/chat/session`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ language }),
            });

            if (!res.ok) {
                throw new Error("Failed to start session");
            }

            const data = await res.json();
            setSessionId(data.session_id);
            setMessages([
                { role: "assistant", content: data.greeting },
            ]);
            toast.success(language === "en" ? "Session started" : "सत्र शुरू हो गया");
            // Focus input after a short delay to allow render
            setTimeout(() => inputRef.current?.focus(), 100);
        } catch (error) {
            console.error("Failed to start session:", error);
            toast.error(t.common.error);
        } finally {
            setStarting(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || !sessionId || loading) return;

        const userMessage = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
        setLoading(true);

        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/chat/message`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage,
                    session_id: sessionId,
                    language: language,
                }),
            });

            if (!res.ok) throw new Error("Failed to send message");

            const data = await res.json();
            setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
            setLoading(false); // Done locally

            // Play audio if available
            if (data.audio_base64) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
                audio.play();
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

    // Voice Functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                sendVoiceMessage(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast.error("Microphone access denied");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendVoiceMessage = async (audioBlob: Blob) => {
        if (!sessionId) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("session_id", sessionId);
        formData.append("language", language);

        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE}/api/chat/voice`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) throw new Error("Voice processing failed");

            const data = await res.json();

            // Add user transcript
            setMessages((prev) => [...prev, { role: "user", content: data.user_transcript }]);

            // Add AI response
            setMessages((prev) => [...prev, { role: "assistant", content: data.ai_response }]);

            // Play audio
            if (data.ai_audio) {
                const audio = new Audio(`data:audio/mp3;base64,${data.ai_audio}`);
                audio.play();
            }

        } catch (error) {
            console.error("Voice message failed:", error);
            toast.error(t.common.error);
        } finally {
            setLoading(false);
        }
    };

    const endSession = async () => {
        if (!sessionId) return;
        setEnding(true);
        try {
            const token = await getToken();
            await fetch(`${API_BASE}/api/chat/session/${sessionId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setSessionId(null);
            setMessages([]);
            toast.success(language === 'hi' ? "बातचीत सहेज ली गई" : "Conversation saved");
        } catch (error) {
            console.error("Failed to end session:", error);
            toast.error(t.common.error);
        } finally {
            setEnding(false);
        }
    };

    if (!sessionId) {
        return (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 fade-in-up">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#064e3b]/20 blur-3xl rounded-full" />
                    <span className="material-symbols-outlined text-8xl text-[#064e3b] relative z-10">
                        graphic_eq
                    </span>
                </div>

                <div className="space-y-4 max-w-md">
                    <h1 className="serif-text text-4xl font-light text-[#064e3b]">{t.talk.title}</h1>
                    <p className="text-[#8ca69e] text-lg font-light leading-relaxed">
                        {t.talk.subtitle}
                    </p>
                </div>

                {/* Language Toggle */}
                <div className="flex bg-[#8ca69e]/10 p-1 rounded-full">
                    <button
                        onClick={() => setLanguage("en")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${language === "en" ? "bg-white shadow text-[#064e3b]" : "text-[#8ca69e] hover:text-[#064e3b]"
                            }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${language === "hi" ? "bg-white shadow text-[#064e3b]" : "text-[#8ca69e] hover:text-[#064e3b]"
                            }`}
                    >
                        हिंदी
                    </button>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={startSession}
                        disabled={starting}
                        className="group relative px-8 py-4 bg-[#064e3b] text-[#fefcfa] rounded-full font-medium text-lg shadow-lg hover:shadow-xl hover:shadow-[#064e3b]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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

                <p className="text-xs text-[#8ca69e]/60 mt-8">
                    Your conversations are private and secure.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col fade-in-up">
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#8ca69e]/10 bg-white/50 backdrop-blur-sm rounded-t-xl">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-[#064e3b]">
                        {loading ? t.talk.processing : (isRecording ? t.talk.listening : t.talk.speaking)}
                    </span>
                </div>
                <button
                    onClick={endSession}
                    disabled={ending}
                    className="text-xs text-[#8ca69e] hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/5"
                >
                    {ending ? t.journal.saving : t.nav.logout}
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`
                                max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm
                                ${msg.role === "user"
                                    ? "bg-[#064e3b] text-[#fefcfa] rounded-br-none"
                                    : "bg-white border border-[#8ca69e]/20 text-foreground rounded-bl-none"
                                }
                            `}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
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

            {/* Input Area */}
            <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-[#8ca69e]/10 rounded-b-xl">
                <div className="relative flex items-end gap-2 bg-white border border-[#8ca69e]/20 rounded-2xl p-2 shadow-sm focus-within:border-[#8ca69e]/40 focus-within:shadow-md transition-all">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-3 rounded-xl transition-all ${isRecording
                            ? "bg-red-50 text-red-500 hover:bg-red-100 animate-pulse"
                            : "text-[#8ca69e] hover:bg-[#8ca69e]/10 hover:text-[#064e3b]"
                            }`}
                        title={isRecording ? t.talk.tapToStop : t.talk.tapToSpeak}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {isRecording ? "mic_off" : "mic"}
                        </span>
                    </button>

                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isRecording ? t.talk.listening : "Share what's on your mind…"}
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-3 text-sm placeholder:text-[#8ca69e]/50"
                        rows={1}
                        style={{ minHeight: "44px" }}
                    />

                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || loading}
                        className="p-3 rounded-xl bg-[#064e3b] text-[#fefcfa] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0a7c5c] transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-xl">send</span>
                    </button>
                </div>
                <p className="text-center text-[10px] text-[#8ca69e]/40 mt-3 font-light">
                    AI can make mistakes. Consider checking important information.
                </p>
            </div>
        </div>
    );
}
