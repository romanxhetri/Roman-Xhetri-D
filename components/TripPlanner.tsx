import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTripPlan } from '../services/geminiService';
import { GroundingChunk } from '../types';
import { LoadingSpinner, LinkIcon, TripPlannerIcon } from './Icons';

const TripPlanner: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<string | null>(null);
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => setLocation(position.coords),
          (err) => console.warn(`Geolocation error in Trip Planner: ${err.message}`)
        );
    }, []);

    const handlePlanTrip = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setResponse(null);
        setSources([]);

        try {
            const result = await getTripPlan(prompt, location);
            setResponse(result.text);
            const metadata = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (metadata) {
                setSources(metadata as GroundingChunk[]);
            }
        } catch (err) {
            console.error('Trip Planner error:', err);
            setError('The travel spirits are busy! I could not conjure a plan. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderResponse = () => {
        if (!response) return null;
        
        // A simple markdown-to-HTML conversion
        const html = response
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br />');

        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <motion.div
            className="w-full md:max-w-4xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 text-center mb-6">
                <div className="inline-block p-4 bg-cyan-500/20 rounded-full mb-2">
                    <TripPlannerIcon />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-400">AI Trip Planner</h1>
                <p className="text-sm md:text-base text-gray-300">Describe your dream vacation, and I'll create a magical itinerary for you.</p>
            </div>

            <div className="flex-shrink-0 mb-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePlanTrip()}
                    placeholder="e.g., 'Plan a 5-day family-friendly trip to Kyoto in the fall, focusing on temples and nature.'"
                    className="w-full bg-black/20 rounded-lg p-4 border border-white/10 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none text-white text-base"
                    rows={3}
                    disabled={isLoading}
                />
                <motion.button
                    onClick={handlePlanTrip}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full mt-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-sky-600 rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isLoading ? <LoadingSpinner /> : 'Plan My Trip'}
                </motion.button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
                 <AnimatePresence mode="wait">
                    {isLoading ? (
                         <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center">
                            <LoadingSpinner />
                            <p className="mt-2 text-cyan-300">Consulting the world map...</p>
                         </motion.div>
                    ) : error ? (
                         <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-red-400 p-4">
                            {error}
                         </motion.div>
                    ) : response ? (
                        <motion.div key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-cyan-300 prose-strong:text-white">
                                {renderResponse()}
                            </div>
                            {sources.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-bold text-cyan-300 mb-2">Sources & Links:</h3>
                                    <ul className="space-y-2">
                                    {sources.map((source, index) => (
                                        <li key={index} className="bg-white/5 p-2 rounded-md hover:bg-white/10">
                                            <a
                                                href={source.web?.uri || source.maps?.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-sky-300 hover:underline flex items-center gap-2"
                                            >
                                                <LinkIcon />
                                                <span>{source.web?.title || source.maps?.title || 'Source Link'}</span>
                                            </a>
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-gray-500 pt-16">
                            <h2 className="text-2xl font-bold mb-2">Your Adventure Awaits</h2>
                            <p>Tell me where you want to go, and I'll handle the rest.</p>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default TripPlanner;