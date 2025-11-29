import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Chat } from "@google/genai";
import { getStoryStream, createStoryChat } from '../services/geminiService';
import { LoadingSpinner, StoryWeaverIcon } from './Icons';

const StoryWeaver: React.FC = () => {
    const [story, setStory] = useState<string>('');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const chatRef = useRef<Chat | null>(null);
    const storyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize the chat session when the component mounts
        chatRef.current = createStoryChat();
    }, []);

    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [story]);

    const handleGenerate = async (currentPrompt: string) => {
        if (!currentPrompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        if (!chatRef.current) {
            chatRef.current = createStoryChat();
        }

        try {
            const stream = await getStoryStream(chatRef.current, currentPrompt);
            let currentText = '';
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                currentText += chunkText;
                setStory(prev => prev + chunkText);
            }
        } catch (err) {
            console.error('Story Weaver error:', err);
            setError('The muse has fled! I could not write the story. Please try again.');
        } finally {
            setIsLoading(false);
            setPrompt(''); // Clear prompt after sending
        }
    };
    
    const handleStart = () => {
        setStory('');
        // Reset chat history by creating a new session
        chatRef.current = createStoryChat(); 
        handleGenerate(prompt);
    };

    const handleContinue = () => {
        const continuePrompt = prompt || "Continue the story.";
        handleGenerate(continuePrompt);
    };

    const hasStarted = story.length > 0;

    return (
        <motion.div
            className="w-full md:max-w-4xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 text-center mb-4">
                <div className="inline-block p-4 bg-orange-500/20 rounded-full mb-2">
                    <StoryWeaverIcon />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-400">AI Story Weaver</h1>
                <p className="text-sm md:text-base text-gray-300">Let's write a story together. Start with a prompt.</p>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 mb-4 bg-black/20 p-4 rounded-lg border border-white/10 min-h-[200px]">
                <AnimatePresence>
                {story ? (
                    <motion.div 
                        className="prose prose-invert max-w-none prose-p:text-gray-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                       <p style={{whiteSpace: 'pre-wrap'}}>{story}</p>
                    </motion.div>
                ) : (
                    !isLoading && 
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <p>Your story will appear here...</p>
                    </div>
                )}
                </AnimatePresence>
                 {isLoading && <div className="flex justify-center"><LoadingSpinner/></div>}
                <div ref={storyEndRef} />
            </div>

            <div className="flex-shrink-0">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={hasStarted ? "What happens next?" : "e.g., 'In a city made of glass, a detective finds a feather...'"}
                    className="w-full bg-black/20 rounded-lg p-3 border border-white/10 focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none text-white"
                    rows={2}
                    disabled={isLoading}
                />
                <div className="flex gap-4 mt-2">
                     {hasStarted ? (
                        <motion.button
                            onClick={handleContinue}
                            disabled={isLoading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 flex items-center justify-center"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                           {isLoading ? <LoadingSpinner /> : 'Continue Story'}
                        </motion.button>
                     ) : (
                         <motion.button
                            onClick={handleStart}
                            disabled={isLoading || !prompt.trim()}
                            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50 flex items-center justify-center"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? <LoadingSpinner /> : 'Start Writing'}
                        </motion.button>
                     )}
                </div>
                {error && <p className="text-red-400 text-center mt-2 text-sm">{error}</p>}
            </div>
        </motion.div>
    );
};

export default StoryWeaver;