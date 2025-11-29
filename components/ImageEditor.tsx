import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { editImageWithPrompt } from '../services/geminiService';
import { LoadingSpinner, UploadIcon, DevToolIcon } from './Icons';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            // result is "data:mime/type;base64,..." -> we want just the base64 part
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error("Failed to read blob as base64 string."));
        }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{file: File, url: string} | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (files: FileList | null) => {
        if (files && files[0]) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                setOriginalImage({ file, url: URL.createObjectURL(file) });
                setEditedImage(null);
                setError(null);
            } else {
                setError('Please upload a valid image file (PNG, JPG, etc.).');
            }
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        handleImageUpload(event.dataTransfer.files);
    }, []);

    const handleGenerate = async () => {
        if (!originalImage || !prompt.trim()) {
            setError('Please upload an image and provide an editing prompt.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const base64Data = await blobToBase64(originalImage.file);
            const resultBase64 = await editImageWithPrompt(base64Data, originalImage.file.type, prompt);
            setEditedImage(`data:${originalImage.file.type};base64,${resultBase64}`);
        } catch (err) {
            console.error('Image editing error:', err);
            setError('Failed to edit image. The AI might be on a creative break. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="w-full md:max-w-5xl md:min-h-[80vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 text-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">AI Image Editor</h1>
                <p className="text-sm md:text-base text-gray-300">Upload an image and tell the AI how to change it.</p>
            </div>

            <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
                {/* Left Side - Controls & Original Image */}
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                     {!originalImage ? (
                        <label 
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-lg cursor-pointer hover:bg-white/5 transition-colors min-h-[200px]"
                        >
                            <UploadIcon />
                            <p>Drop an image here or click to upload</p>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} />
                        </label>
                     ) : (
                         <div className="flex-grow bg-black/20 rounded-lg p-2 border border-white/10 flex flex-col">
                             <h2 className="text-center text-gray-400 mb-2">Original Image</h2>
                             <img src={originalImage.url} alt="Original" className="w-full h-full object-contain rounded" />
                         </div>
                     )}
                     <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2 border border-white/10">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'Add a retro filter' or 'Make the sky purple'"
                            className="flex-1 bg-transparent focus:outline-none text-white px-2"
                            disabled={isLoading}
                        />
                    </div>
                    <motion.button
                        onClick={handleGenerate}
                        disabled={isLoading || !originalImage}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? <LoadingSpinner /> : 'Generate Edit'}
                    </motion.button>
                </div>

                {/* Right Side - Edited Image */}
                <div className="w-full md:w-1/2 flex flex-col bg-black/20 rounded-lg p-2 border border-white/10 min-h-[300px] md:min-h-0">
                     <h2 className="text-center text-gray-400 mb-2">Edited Image</h2>
                     <div className="flex-grow flex items-center justify-center relative">
                        <AnimatePresence>
                        {isLoading && (
                            <motion.div 
                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50"
                                initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
                            >
                                <LoadingSpinner />
                                <p className="mt-2 text-sm">AI is painting...</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                         {editedImage ? (
                             <img src={editedImage} alt="Edited" className="w-full h-full object-contain rounded" />
                         ) : (
                             !isLoading && <p className="text-gray-500">Your edited image will appear here.</p>
                         )}
                     </div>
                </div>
            </div>
             {error && <p className="text-red-400 text-center mt-4 text-sm">{error}</p>}
        </motion.div>
    );
};

export default ImageEditor;