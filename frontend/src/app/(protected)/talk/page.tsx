"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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

type VoiceState = "idle" | "listening" | "processing" | "speaking";

export default function TalkPage() {
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
    const router = require("next/navigation").useRouter();

    // Continuous Voice State
    const [voiceState, setVoiceState] = useState<VoiceState>("idle");
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const silenceStartRef = useRef<number | null>(null);
    const vadFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

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
            setLoading(false);

            if (data.audio_base64) {
                const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
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

    // Continuous Voice Loop implementing VAD (Voice Activity Detection)
    const cleanupVoiceResources = () => {
        if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
    };

    const startListeningLoop = async () => {
        if (!sessionId) return;
        cleanupVoiceResources(); // ensure clean state
        setVoiceState("listening");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
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
                // If it wasn't manually aborted (idle state), process it
                if (audioChunksRef.current.length > 0 && streamRef.current !== null) {
                    sendVoiceMessage(audioBlob);
                }
            };

            // Setup VAD
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

                if (average > 5) { // Highly sensitive Is Speaking threshold
                    silenceStartRef.current = null;
                } else {
                    if (silenceStartRef.current === null) {
                        silenceStartRef.current = Date.now();
                    } else if (Date.now() - silenceStartRef.current > 3000) {
                        // 3 seconds of silence -> Stop recording and trigger sending
                        mediaRecorder.stop();
                        if (vadFrameRef.current) cancelAnimationFrame(vadFrameRef.current);
                        return; // Exit loop
                    }
                }
                vadFrameRef.current = requestAnimationFrame(checkSilence);
            };

            // Standard start captures a single Blob when stopped
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
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) throw new Error("Voice processing failed");

            const data = await res.json();

            // Add user transcript if they actually spoke words
            if (data.user_transcript && data.user_transcript.trim().length > 0) {
                setMessages((prev) => [...prev, { role: "user", content: data.user_transcript }]);
            }

            // Add AI response
            if (data.ai_response && data.ai_response.trim().length > 0) {
                setMessages((prev) => [...prev, { role: "assistant", content: data.ai_response }]);
            }

            // Play audio and auto-continue loop
            if (data.ai_audio) {
                setVoiceState("speaking");
                const audio = new Audio(`data:audio/wav;base64,${data.ai_audio}`);
                currentAudioRef.current = audio;

                audio.onended = () => {
                    // Start listening again only if user didn't hit stop
                    setVoiceState((current) => {
                        if (current === "speaking") {
                            setTimeout(startListeningLoop, 100);
                            return "listening";
                        }
                        return current;
                    });
                };

                audio.play().catch(e => {
                    console.error("Audio playback blocked", e);
                    setVoiceState("idle");
                });
            } else {
                // Fallback if no audio (e.g. user was just silent)
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
            // Ignore tiny noises that transcribe fail, just go back to listening
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
        
        // Only prompt to save if they actually sent a message (more than just the AI greeting)
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
            
            // End the session stats natively
            await fetch(`${API_BASE}/api/chat/session/${sessionId}/end`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (saveAsJournal) {
                const toastId = toast.loading(language === 'hi' ? "जर्नल में बदल रहे हैं..." : "Converting to Journal...");
                const res = await fetch(`${API_BASE}/api/chat/session/${sessionId}/convert_to_journal`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                if (res.ok) {
                    toast.success(language === 'hi' ? "जर्नल के रूप में सहेजा गया!" : "Saved as Journal Entry!", { id: toastId });
                    setSessionId(null);
                    setMessages([]);
                    router.push("/journal");
                    return;
                } else {
                    toast.error(language === 'hi' ? "सहेजने में विफल" : "Failed to convert", { id: toastId });
                }
            } else {
                toast.success(language === 'hi' ? "बातचीत समाप्त हुई" : "Conversation ended");
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

    // Dynamic UI Helpers
    const isBusy = loading || voiceState === "processing" || voiceState === "speaking";

    const getStatusText = () => {
        if (voiceState === "listening") return t.talk.listening || "Listening... Start speaking";
        if (voiceState === "processing") return t.talk.processing || "Thinking...";
        if (voiceState === "speaking") return t.talk.speaking || "Speaking...";
        if (loading) return t.talk.processing || "Typing...";
        return "";
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
                    <button
                        onClick={() => setLanguage("hinglish")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${language === "hinglish" ? "bg-white shadow text-[#064e3b]" : "text-[#8ca69e] hover:text-[#064e3b]"
                            }`}
                    >
                        Hinglish
                    </button>
                    <button
                        onClick={() => setLanguage("gu")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${language === "gu" ? "bg-white shadow text-[#064e3b]" : "text-[#8ca69e] hover:text-[#064e3b]"
                            }`}
                    >
                        ગુજરાતી
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
                    {(voiceState !== "idle" || loading) ? (
                        <>
                            <div className={`w-2 h-2 rounded-full ${voiceState === 'listening' ? 'bg-red-500' : 'bg-green-500'} animate-pulse`} />
                            <span className="text-sm font-medium text-[#064e3b]">
                                {getStatusText()}
                            </span>
                        </>
                    ) : (
                        <>
                            <div className="w-2 h-2 rounded-full bg-[#8ca69e]/40" />
                            <span className="text-sm font-medium text-[#8ca69e]">
                                IDLE
                            </span>
                        </>
                    )}
                </div>
                <button
                    onClick={handleEndSessionClick}
                    disabled={ending}
                    className="text-xs text-[#8ca69e] hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-destructive/5"
                >
                    {ending ? t.journal.saving : t.nav.logout}
                </button>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide ${voiceState !== "idle" ? "pb-32" : ""}`}>
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

            {/* Input Area */}
            <div className="p-4 bg-white/50 backdrop-blur-sm border-t border-[#8ca69e]/10 rounded-b-xl relative z-10">

                {/* Visualizer Orb for voice mode */}
                {voiceState !== "idle" && (
                    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 flex items-center justify-center pointer-events-none">
                        <div className={`w-12 h-12 rounded-full transition-all duration-300 shadow-xl flex items-center justify-center
                            ${voiceState === 'listening' ? 'bg-red-500 scale-110 shadow-red-500/40 animate-pulse' :
                                voiceState === 'processing' ? 'bg-[#8ca69e] scale-90 opacity-70' :
                                    'bg-[#064e3b] scale-125 shadow-[#064e3b]/40'}
                        `}>
                            <span className="material-symbols-outlined text-white text-xl">
                                {voiceState === 'listening' ? 'mic' : voiceState === 'processing' ? 'hourglass_empty' : 'graphic_eq'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-white border border-[#8ca69e]/20 rounded-2xl p-2 shadow-sm focus-within:border-[#8ca69e]/40 focus-within:shadow-md transition-all">
                    <button
                        onClick={voiceState !== "idle" ? stopContinuousVoice : startListeningLoop}
                        className={`p-3 rounded-xl transition-all ${voiceState !== "idle"
                            ? "bg-red-50 text-red-600 hover:bg-red-100 shadow-inner"
                            : "text-[#8ca69e] hover:bg-[#8ca69e]/10 hover:text-[#064e3b]"
                            }`}
                        title={voiceState !== "idle" ? "Stop Live Voice" : "Start Live Voice"}
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
                    >
                        <span className="material-symbols-outlined text-xl">send</span>
                    </button>
                </div>
                <p className="text-center text-[10px] text-[#8ca69e]/40 mt-3 font-light">
                    {voiceState !== "idle" ? "Hands-free continuous mode is active." : "AI can make mistakes. Consider checking important information."}
                </p>
            </div>
            {/* Save Prompt Modal */}
            {showSavePrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-[#fefcfa] rounded-xl border border-[#8ca69e]/20 p-8 max-w-sm w-full shadow-2xl fade-in-up">
                        <div className="text-center space-y-4">
                            <span className="material-symbols-outlined text-4xl text-[#064e3b] mb-2">
                                import_contacts
                            </span>
                            <h3 className="serif-text text-xl font-medium">
                                {language === 'hi' ? "इस बातचीत को जर्नल में बदलें?" : "Convert to Journal?"}
                            </h3>
                            <p className="text-sm text-[#8ca69e] leading-relaxed">
                                {language === 'hi' 
                                    ? "हम इस बातचीत का सारांश तैयार करके इसे आपकी डायरी में नए टैग्स के साथ सेव कर सकते हैं।" 
                                    : "We can summarize this conversation and save it to your diary with AI generated tags."}
                            </p>
                            <div className="flex flex-col gap-3 pt-4">
                                <button
                                    onClick={() => endSession(true)}
                                    disabled={ending}
                                    className="w-full px-4 py-3 rounded-lg bg-[#064e3b] text-[#fefcfa] text-sm font-medium hover:bg-[#086a51] transition-colors disabled:opacity-50"
                                >
                                    {ending ? "Saving..." : (language === 'hi' ? "हाँ, डायरी में सहेजें" : "Yes, save to Diary")}
                                </button>
                                <button
                                    onClick={() => endSession(false)}
                                    disabled={ending}
                                    className="w-full px-4 py-3 rounded-lg border border-[#8ca69e]/20 text-[#8ca69e] text-sm font-medium hover:bg-[#8ca69e]/10 transition-colors"
                                >
                                    {language === 'hi' ? "नहीं, बस छोड़ दें" : "No, just discard"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

