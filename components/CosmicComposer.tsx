import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { generateCosmicComposition } from '../services/geminiService';
import { LoadingSpinner, CosmicComposerIcon } from './Icons';

// --- Audio Helper Functions (copied from TextToSpeech) ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// --- End Helper Functions ---

const CosmicComposer: React.FC = () => {
    const [prompt, setPrompt] = useState('An epic and adventurous orchestral piece for a fantasy battle.');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const handleCompose = async () => {
        if (!prompt.trim()) {
            setError('Please provide a prompt to compose music.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAudioBuffer(null);
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        try {
            const base64Audio = await generateCosmicComposition(prompt);
            
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            
            const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            setAudioBuffer(buffer);
        } catch (err) {
            console.error('Cosmic Composer Error:', err);
            setError('The cosmic symphony is out of tune. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const playAudio = useCallback(() => {
        if (!audioBuffer || !audioContextRef.current) return;
        
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        audioSourceRef.current = source;
    }, [audioBuffer]);

    return (
        <motion.div
            className="w-full md:max-w-4xl md:min-h-[75vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
        >
            <div className="flex flex-col items-center text-center mb-6">
                 <div className="p-4 bg-cyan-500/20 rounded-full mb-4">
                    <CosmicComposerIcon className="h-10 w-10 text-cyan-300" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-sky-400">Cosmic Composer</h1>
                <p className="text-base md:text-lg text-gray-300">Describe a mood or a scene, and let the AI create a unique soundscape for you.</p>
            </div>
            
            <div className="flex-grow flex flex-col gap-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., 'A serene, ambient track for stargazing'"
                    className="w-full flex-grow bg-black/20 rounded-lg p-4 border border-white/10 focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none text-white"
                    rows={5}
                    disabled={isLoading}
                />
                <motion.button
                    onClick={handleCompose}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-sky-600 rounded-lg shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isLoading ? <LoadingSpinner /> : 'Compose'}
                </motion.button>
            </div>

            <div className="mt-6 text-center h-16 flex items-center justify-center">
                {error && <p className="text-red-400">{error}</p>}
                {!isLoading && audioBuffer && (
                    <motion.button
                         onClick={playAudio}
                         className="px-8 py-3 bg-green-600 rounded-lg shadow-lg hover:bg-green-500 transition-all flex items-center gap-2"
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.98 }}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                        Play Composition
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default CosmicComposer;
