import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateImageFromPrompt, applyDesignToClothing } from '../services/geminiService';
import { LoadingSpinner, MagicWandIcon, TshirtIcon } from './Icons';

const TSHIRT_MOCKUP_URL = 'https://storage.googleapis.com/aistudio-v2-a-prod-static/google-for-developers/88e5959b19e900989f6ce48e718b953d.png';

const fetchImageAsBase64 = async (url: string): Promise<{data: string, mimeType: string}> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    const blob = await response.blob();
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve({ data: reader.result.split(',')[1], mimeType: blob.type });
            } else {
                reject(new Error("Failed to read blob as base64 string."));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

const ClothingDesigner: React.FC = () => {
    const [prompt, setPrompt] = useState('A hyper-realistic illustration of a wolf howling at a neon moon');
    const [designUrl, setDesignUrl] = useState<string | null>(null);
    const [mockupUrl, setMockupUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<false | 'design' | 'mockup'>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateDesign = async () => {
        if (!prompt.trim()) return;
        setIsLoading('design');
        setError(null);
        setDesignUrl(null);
        setMockupUrl(null);

        try {
            const url = await generateImageFromPrompt(prompt, '1:1');
            setDesignUrl(url);
        } catch (err) {
            console.error(err);
            setError('Could not generate the design. The muses are not inspired today.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApplyToMockup = async () => {
        if (!designUrl) return;
        setIsLoading('mockup');
        setError(null);

        try {
            const designImage = await fetchImageAsBase64(designUrl);
            const mockupImage = await fetchImageAsBase64(TSHIRT_MOCKUP_URL);

            const resultBase64 = await applyDesignToClothing(mockupImage, designImage);
            setMockupUrl(`data:image/png;base64,${resultBase64}`);

        } catch (err) {
            console.error(err);
            setError('Failed to apply design to mockup.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center p-4">
            <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">AI Clothing Designer</h1>
            <p className="text-sm text-gray-400 mb-4">Describe a design, and I'll create it for you.</p>

            <div className="w-full max-w-2xl flex items-center gap-2 mb-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'An astronaut DJing on Saturn's rings'"
                    className="flex-1 bg-black/20 rounded-lg p-3 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:outline-none text-white"
                    disabled={!!isLoading}
                />
                <button onClick={handleGenerateDesign} disabled={!!isLoading || !prompt} className="p-3 bg-purple-600 rounded-lg disabled:opacity-50">
                    {isLoading === 'design' ? <LoadingSpinner /> : <MagicWandIcon className="w-5 h-5" />}
                </button>
            </div>
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            
            <div className="flex-grow w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg border border-white/10 flex flex-col items-center justify-center p-4">
                    <h2 className="font-bold mb-2">1. Generated Design</h2>
                     <div className="aspect-square w-full max-w-sm flex items-center justify-center">
                        {isLoading === 'design' && <LoadingSpinner />}
                        {designUrl && (
                             <motion.img 
                                src={designUrl} 
                                alt="Generated design" 
                                className="max-w-full max-h-full rounded-md" 
                                initial={{opacity:0}} animate={{opacity:1}}
                             />
                        )}
                    </div>
                    {designUrl && !mockupUrl && (
                        <button onClick={handleApplyToMockup} disabled={!!isLoading} className="mt-4 p-2 bg-indigo-600 rounded-lg flex items-center gap-2 disabled:opacity-50">
                             {isLoading === 'mockup' ? <LoadingSpinner /> : <TshirtIcon className="w-5 h-5" />} Apply to T-Shirt
                        </button>
                    )}
                </div>
                <div className="bg-black/20 rounded-lg border border-white/10 flex flex-col items-center justify-center p-4">
                    <h2 className="font-bold mb-2">2. T-Shirt Mockup</h2>
                    <div className="aspect-square w-full max-w-sm flex items-center justify-center">
                        {isLoading === 'mockup' && <LoadingSpinner />}
                        <AnimatePresence>
                        {mockupUrl ? (
                            <motion.img src={mockupUrl} alt="T-Shirt mockup" className="max-w-full max-h-full rounded-md" initial={{opacity:0}} animate={{opacity:1}} />
                        ) : (
                           !isLoading && <img src={TSHIRT_MOCKUP_URL} alt="Blank T-Shirt" className="max-w-full max-h-full rounded-md opacity-30" />
                        )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClothingDesigner;
