import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { generateSpeech } from '../services/geminiService';
import { LoadingSpinner, TtsIcon } from './Icons';

// --- Audio Helper Functions (copied from LiveConversation) ---
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

const VOICES = [
    { name: 'Zephyr', id: 'Zephyr' },
    { name: 'Kore', id: 'Kore' },
    { name: 'Puck', id: 'Puck' },
    { name: 'Charon', id: 'Charon' },
    { name: 'Fenrir', id: 'Fenrir' },
];

const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('Hello! I am SageX, your mystical guide in this AI universe. ✨');
    const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('Please enter some text to generate speech.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAudioBuffer(null);
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }

        try {
            const base64Audio = await generateSpeech(text, selectedVoice);
            
            if (!audioContextRef.current) {
                // FIX: Cast window to any to access vendor-prefixed webkitAudioContext for cross-browser compatibility.
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            
            const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            setAudioBuffer(buffer);
        } catch (err) {
            console.error('TTS Generation Error:', err);
            setError('Failed to generate speech. The AI might be lost for words. Please try again.');
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
            className="w-full h-full md:max-w-4xl md:h-[75vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: 'backOut' }}
        >
            <div className="flex flex-col items-center text-center mb-6">
                 <div className="p-4 bg-purple-500/20 rounded-full mb-4">
                    <TtsIcon />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">AI Text-to-Speech</h1>
                <p className="text-base md:text-lg text-gray-300">Transform your text into lifelike speech with a variety of AI voices.</p>
            </div>
            
            <div className="flex-grow flex flex-col gap-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text here..."
                    className="w-full flex-grow bg-black/20 rounded-lg p-4 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-white"
                    rows={8}
                    disabled={isLoading}
                />
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full sm:w-1/2">
                         <label htmlFor="voice-select" className="block text-sm font-medium text-gray-300 mb-1">Select a Voice</label>
                         <select
                            id="voice-select"
                            value={selectedVoice}
                            onChange={(e) => setSelectedVoice(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-gray-900/50 border border-white/10 rounded-lg p-2.5 text-white focus:ring-purple-500 focus:border-purple-500"
                        >
                            {VOICES.map(voice => (
                                <option key={voice.id} value={voice.id}>{voice.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-1/2 flex items-end h-full">
                        <motion.button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? <LoadingSpinner /> : 'Generate Speech'}
                        </motion.button>
                    </div>
                </div>
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
                        Play Generated Audio
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default TextToSpeech;