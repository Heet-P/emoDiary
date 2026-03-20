"use client";

import { motion, AnimatePresence } from "framer-motion";

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    reason?: string;
}

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
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
                                <h2 className="text-2xl font-bold text-[#064e3b]">Full Access (Free)</h2>
                                <p className="text-[#8ca69e]">
                                    {reason || "You're already on a completely free plan with unlimited access."}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full py-2 text-xs font-medium text-[#8ca69e] hover:text-[#064e3b] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
