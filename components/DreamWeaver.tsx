import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { interpretAndVisualizeDream } from '../services/geminiService';
import { LoadingSpinner, DreamWeaverIcon } from './Icons';

type DreamState = 'IDLE' | 'LOADING' | 'RESULT' | 'ERROR';

const DreamWeaver: React.FC = () => {
    const [dreamDescription, setDreamDescription] = useState('');
    const [result, setResult] = useState<{ interpretation: string; imageUrl: string } | null>(null);
    const [dreamState, setDreamState] = useState<DreamState>('IDLE');
    const [error, setError] = useState<string | null>(null);

    const handleWeaveDream = async () => {
        if (!dreamDescription.trim()) {
            setError('Please describe your dream before I can weave it.');
            return;
        }

        setDreamState('LOADING');
        setError(null);
        setResult(null);

        try {
            const dreamResult = await interpretAndVisualizeDream(dreamDescription);
            setResult(dreamResult);
            setDreamState('RESULT');
        } catch (err) {
            console.error('Dream Weaver error:', err);
            setError('The threads of the dreamscape are tangled. Please try again later.');
            setDreamState('ERROR');
        }
    };
    
    const handleReset = () => {
        setDreamDescription('');
        setResult(null);
        setError(null);
        setDreamState('IDLE');
    };

    return (
        <motion.div
            className="w-full md:max-w-5xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 text-center mb-6">
                <div className="inline-block p-4 bg-indigo-500/20 rounded-full mb-2">
                    <DreamWeaverIcon className="h-10 w-10 text-indigo-300" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">AI Dream Weaver</h1>
                <p className="text-sm md:text-base text-gray-300">Unravel the mysteries of your subconscious and see your dreams come to life.</p>
            </div>

            <div className="flex-grow flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {dreamState === 'IDLE' && (
                        <motion.div
                            key="idle"
                            className="w-full max-w-2xl flex flex-col items-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <textarea
                                value={dreamDescription}
                                onChange={(e) => setDreamDescription(e.target.value)}
                                placeholder="Describe your dream in as much detail as you can remember..."
                                className="w-full h-48 bg-black/20 rounded-lg p-4 border border-white/10 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-white text-base"
                                disabled={dreamState === 'LOADING'}
                            />
                            <motion.button
                                onClick={handleWeaveDream}
                                disabled={dreamState === 'LOADING' || !dreamDescription.trim()}
                                className="mt-4 px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-lg"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Weave My Dream
                            </motion.button>
                        </motion.div>
                    )}

                    {dreamState === 'LOADING' && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="text-center">
                                <LoadingSpinner />
                                <p className="mt-2 text-indigo-300">Following the silver threads of your dream...</p>
                            </div>
                        </motion.div>
                    )}
                    
                    {(dreamState === 'RESULT' && result) && (
                         <motion.div
                            key="result"
                            className="w-full h-full flex flex-col md:flex-row gap-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                         >
                            <div className="w-full md:w-1/2 flex flex-col bg-black/20 rounded-lg border border-white/10 p-4">
                                <h2 className="text-xl font-bold text-purple-300 mb-2">Interpretation</h2>
                                <div className="prose prose-sm prose-invert max-w-none prose-p:text-gray-200 overflow-y-auto pr-2">
                                    <p>{result.interpretation}</p>
                                </div>
                            </div>
                             <div className="w-full md:w-1/2 flex flex-col bg-black/20 rounded-lg border border-white/10 p-4">
                                <h2 className="text-xl font-bold text-purple-300 mb-2">Visualization</h2>
                                <div className="flex-grow flex items-center justify-center">
                                    <img src={result.imageUrl} alt="Dream visualization" className="w-full h-auto object-contain rounded-md shadow-2xl" />
                                </div>
                            </div>
                         </motion.div>
                    )}

                </AnimatePresence>
            </div>
            
             <div className="flex-shrink-0 pt-4 text-center">
                 {(dreamState === 'ERROR' || error) && <p className="text-red-400 text-sm mb-2">{error}</p>}
                
                {dreamState === 'RESULT' || dreamState === 'ERROR' ? (
                     <motion.button
                        onClick={handleReset}
                        className="px-6 py-2 bg-gray-600 rounded-lg shadow-lg hover:bg-gray-500 transition-colors"
                     >
                        Weave Another Dream
                    </motion.button>
                ) : (
                    <p className="text-xs text-gray-500">For entertainment purposes only. This is not a substitute for professional advice.</p>
                )}
             </div>
        </motion.div>
    );
};

export default DreamWeaver;