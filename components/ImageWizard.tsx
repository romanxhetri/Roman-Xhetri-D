import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateImageFromPrompt } from '../services/geminiService';
import { LoadingSpinner, MagicWandIcon } from './Icons';

type GenerationState = 'IDLE' | 'GENERATING' | 'SUCCESS' | 'ERROR';
type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

const ImageWizard: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [generationState, setGenerationState] = useState<GenerationState>('IDLE');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please provide a prompt to generate an image.');
            return;
        }
        setGenerationState('GENERATING');
        setError(null);
        setImageUrl(null);

        try {
            const url = await generateImageFromPrompt(prompt, aspectRatio);
            setImageUrl(url);
            setGenerationState('SUCCESS');
        } catch (err: any) {
            console.error('Image generation error:', err);
            setError('The magic spell failed! Could not generate image. Please try again.');
            setGenerationState('ERROR');
        }
    };

    const resetState = () => {
        setPrompt('');
        setImageUrl(null);
        setError(null);
        setGenerationState('IDLE');
    }

    return (
        <motion.div
            className="w-full h-full flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            <AnimatePresence mode="wait">
                {generationState === 'GENERATING' && (
                     <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center flex flex-col items-center justify-center h-full">
                         <div className="relative w-32 h-32 mb-6">
                            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-50"></div>
                            <div className="relative w-full h-full bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-purple-400/50">
                               <MagicWandIcon className="h-12 w-12 text-purple-300 animate-pulse" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Creating Magic...</h2>
                        <p className="text-gray-300">Your image is being conjured from the digital ether.</p>
                    </motion.div>
                )}
                {generationState === 'SUCCESS' && imageUrl && (
                     <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full w-full">
                        <img src={imageUrl} alt="Generated" className="max-h-[60vh] w-auto rounded-lg shadow-2xl mb-6" />
                        <div className="flex gap-4">
                            <a href={imageUrl} download={`sxg-${prompt.slice(0, 20)}.jpeg`} className="px-6 py-2 bg-green-600 rounded-lg shadow-lg hover:bg-green-500 transition-colors">Download</a>
                            <button onClick={resetState} className="px-6 py-2 bg-gray-600 rounded-lg shadow-lg hover:bg-gray-500 transition-colors">Create Another</button>
                        </div>
                    </motion.div>
                )}
                {(generationState === 'IDLE' || generationState === 'ERROR') && (
                     <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full w-full max-w-3xl mx-auto p-2 sm:p-0">
                        <div className="flex-grow flex flex-col">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to create... e.g., 'A majestic crystal castle on a floating island at twilight'"
                                className="w-full flex-grow bg-black/20 rounded-lg p-4 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-white text-lg"
                                rows={6}
                            />
                        </div>
                         <div className="flex-shrink-0 flex flex-col md:flex-row items-center gap-4 mt-4">
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                <span className="text-gray-300 text-sm">Aspect Ratio:</span>
                                {ASPECT_RATIOS.map(ar => (
                                    <button key={ar} onClick={() => setAspectRatio(ar)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${aspectRatio === ar ? 'bg-purple-600' : 'bg-gray-700/50 hover:bg-gray-700'}`}>{ar}</button>
                                ))}
                            </div>
                            <motion.button
                                onClick={handleGenerate}
                                className="w-full md:w-auto flex-grow px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all text-xl font-bold"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Generate
                            </motion.button>
                        </div>
                        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ImageWizard;