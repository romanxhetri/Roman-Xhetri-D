import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateVideoFromPrompt } from '../services/geminiService';
import { LoadingSpinner, VideoConjurerIcon } from './Icons';

type GenerationState = 'IDLE' | 'CHECKING_KEY' | 'NEEDS_KEY' | 'GENERATING' | 'SUCCESS' | 'ERROR';

const LOADING_MESSAGES = [
    "Gathering starlight...",
    "Weaving the dream threads...",
    "Consulting the cosmic echoes...",
    "Polishing the pixels with magic...",
    "The spell is almost complete!",
];

const VideoConjurer: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generationState, setGenerationState] = useState<GenerationState>('CHECKING_KEY');
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

    const checkApiKey = async () => {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
            setGenerationState('IDLE');
        } else {
            setGenerationState('NEEDS_KEY');
        }
    };
    
    useEffect(() => {
        checkApiKey();
    }, []);

    useEffect(() => {
        // FIX: Use ReturnType<typeof setInterval> for browser compatibility instead of NodeJS.Timeout
        let interval: ReturnType<typeof setInterval>;
        if (generationState === 'GENERATING') {
            interval = setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = LOADING_MESSAGES.indexOf(prev);
                    return LOADING_MESSAGES[(currentIndex + 1) % LOADING_MESSAGES.length];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [generationState]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please cast a spell (enter a prompt).');
            return;
        }
        
        setGenerationState('GENERATING');
        setError(null);
        setVideoUrl(null);

        try {
            const url = await generateVideoFromPrompt(prompt, aspectRatio, (op) => {
                console.log('Polling operation:', op);
            });
            setVideoUrl(url);
            setGenerationState('SUCCESS');
        } catch (err: any) {
             console.error('Video generation error:', err);
             if (err.message && err.message.includes("Requested entity was not found.")) {
                setError('Your API key seems to be invalid. Please select a new one.');
                setGenerationState('NEEDS_KEY');
             } else {
                setError('The spell fizzled! Something went wrong during generation.');
                setGenerationState('ERROR');
             }
        }
    };

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        // Assume key selection is successful and let the user proceed.
        // The API call will fail if the key is bad, and we can handle that.
        setGenerationState('IDLE');
    };

    const resetState = () => {
        setPrompt('');
        setVideoUrl(null);
        setError(null);
        setGenerationState('IDLE');
    }

    const renderContent = () => {
        switch (generationState) {
            case 'CHECKING_KEY':
                return <div className="flex flex-col items-center justify-center h-full"><LoadingSpinner /><p className="mt-2">Checking magical credentials...</p></div>
            
            case 'NEEDS_KEY':
                return (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                        <h2 className="text-xl md:text-2xl font-bold mb-4">API Key Required for Veo</h2>
                        <p className="max-w-md mb-6 text-gray-300">The Video Conjurer uses a powerful spell (the Veo model) that requires you to select an API key. Please note that usage may incur charges.</p>
                        <motion.button
                            onClick={handleSelectKey}
                            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg"
                            whileHover={{ scale: 1.05 }}
                        >
                            Select API Key
                        </motion.button>
                        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-purple-300 hover:underline mt-4">
                            Learn more about billing
                        </a>
                         {error && <p className="text-red-400 mt-4">{error}</p>}
                    </div>
                );

            case 'GENERATING':
                return (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                         <div className="relative w-32 h-32 mb-6">
                            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-50"></div>
                            <div className="relative w-full h-full bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-purple-400/50">
                               <VideoConjurerIcon className="h-12 w-12 text-purple-300 animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Conjuring Video...</h2>
                        <p className="text-gray-300 transition-opacity duration-500">{loadingMessage}</p>
                    </div>
                );
            
            case 'SUCCESS':
                return (
                     <div className="flex flex-col items-center justify-center h-full w-full">
                        <video src={videoUrl!} controls autoPlay className="w-full max-w-2xl rounded-lg shadow-2xl mb-6" />
                        <div className="flex gap-4">
                            <a href={videoUrl!} download={`${prompt.slice(0, 20)}.mp4`} className="px-6 py-2 bg-green-600 rounded-lg shadow-lg hover:bg-green-500 transition-colors">Download</a>
                            <button onClick={resetState} className="px-6 py-2 bg-gray-600 rounded-lg shadow-lg hover:bg-gray-500 transition-colors">Conjure Another</button>
                        </div>
                    </div>
                );
            
            case 'IDLE':
            case 'ERROR':
                return (
                    <div className="flex flex-col h-full w-full max-w-2xl mx-auto">
                        <div className="flex-grow flex flex-col">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the video you want to conjure... e.g., 'An astronaut riding a unicorn on the moon'"
                                className="w-full flex-grow bg-black/20 rounded-lg p-4 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-white text-lg"
                                rows={6}
                            />
                        </div>
                         <div className="flex-shrink-0 flex flex-col md:flex-row items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-300">Aspect Ratio:</span>
                                <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 rounded-lg ${aspectRatio === '16:9' ? 'bg-purple-600' : 'bg-gray-700'}`}>16:9</button>
                                <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 rounded-lg ${aspectRatio === '9:16' ? 'bg-purple-600' : 'bg-gray-700'}`}>9:16</button>
                            </div>
                            <motion.button
                                onClick={handleGenerate}
                                className="w-full md:w-auto flex-grow px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all text-xl font-bold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Conjure
                            </motion.button>
                        </div>
                        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                    </div>
                );
        }
    }

    return (
        <motion.div
            className="w-full h-full md:max-w-5xl md:h-[80vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 text-center mb-6">
                <div className="inline-block p-4 bg-purple-500/20 rounded-full mb-2">
                    <VideoConjurerIcon className="h-10 w-10 text-purple-300"/>
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Video Conjurer</h1>
                <p className="text-sm md:text-base text-gray-300">Bring your imagination to life with the power of Veo AI.</p>
            </div>
            <div className="flex-grow flex items-center justify-center">
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={generationState}
                        className="w-full h-full flex flex-col items-center justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default VideoConjurer;