import React, { useState } from 'react';
import { Sparkles, X, Send, Cpu, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AIAssistantProps {
    onGenerate: (prompt: string) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onGenerate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onGenerate(prompt);
            setPrompt('');
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-2xl z-20 hover:scale-110 transition-transform ai-assistant-btn border border-white/20"
            >
                <Sparkles className="text-white w-8 h-8 fill-white/20" />
            </button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-colors duration-300"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-lg bg-white dark:bg-[#0d0d12] border border-zinc-200 dark:border-white/10 rounded-3xl p-8 relative shadow-[0_0_50px_rgba(147,51,234,0.1)] dark:shadow-[0_0_50px_rgba(147,51,234,0.2)] transition-colors duration-300"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-6 right-6 text-zinc-400 dark:text-gray-500 hover:text-zinc-600 dark:hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                    <Cpu className="text-purple-400 w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">AI Flow Designer</h2>
                                    <p className="text-zinc-500 dark:text-gray-400 text-sm">Describe your workflow to generate logic nodes.</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="relative">
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="e.g. Create a recruitment workflow that triggers on application, filters by experience, and sends an email..."
                                        className="w-full h-32 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-gray-600 focus:border-purple-500 outline-none transition-all resize-none text-sm leading-relaxed"
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] text-zinc-400 dark:text-gray-600 font-medium">
                                        POWERED BY NEXFLOW AI
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!prompt.trim()}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all disabled:opacity-50 disabled:hover:shadow-none"
                                >
                                    <Wand2 className="w-5 h-5" />
                                    Generate Workflow
                                </button>
                            </form>

                            <div className="mt-8 grid grid-cols-2 gap-3">
                                <div className="p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5 text-[10px] text-zinc-500 dark:text-gray-400 italic">
                                    "Auto-generate API endpoints"
                                </div>
                                <div className="p-3 bg-zinc-50 dark:bg-white/5 rounded-xl border border-zinc-100 dark:border-white/5 text-[10px] text-zinc-500 dark:text-gray-400 italic">
                                    "Build a multi-stage approval"
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
