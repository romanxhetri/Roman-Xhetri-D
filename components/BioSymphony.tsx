import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBioSymphony } from '../services/geminiService';
import { LoadingSpinner, BioSymphonyIcon, SpeakerWaveIcon } from './Icons';

type SymphonyState = 'IDLE' | 'REQUESTING_CAM' | 'CAM_ACTIVE' | 'ANALYZING' | 'RESULT' | 'ERROR';

const LOADING_MESSAGES = [
    "Calibrating emotional sensors...",
    "Reading your aura...",
    "Translating feelings into photons...",
    "Composing a symphony for your soul...",
    "The art is taking form..."
];

// --- Audio Helper Functions ---
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


const BioSymphony: React.FC = () => {
    const [symphonyState, setSymphonyState] = useState<SymphonyState>('IDLE');
    const [result, setResult] = useState<{ poem: string; imageUrl: string; audioBase64: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const handleStart = async () => {
        setSymphonyState('REQUESTING_CAM');
        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setSymphonyState('CAM_ACTIVE');
        } catch (err) {
            console.error("Camera access denied:", err);
            setError("Camera access is required for this experience. Please enable it in your browser settings.");
            setSymphonyState('ERROR');
        }
    };
    
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (symphonyState === 'ANALYZING') {
            interval = setInterval(() => {
                setLoadingMessage(prev => LOADING_MESSAGES[(LOADING_MESSAGES.indexOf(prev) + 1) % LOADING_MESSAGES.length]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [symphonyState]);

    const playAudio = useCallback(async (base64Audio: string) => {
        try {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            if (audioSourceRef.current) {
                audioSourceRef.current.stop();
            }

            const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.start(0);
            audioSourceRef.current = source;
        } catch (e) {
            console.error("Failed to play audio:", e);
        }
    }, []);

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setSymphonyState('ANALYZING');
        stopCamera();

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.9);
        const base64Data = dataUrl.split(',')[1];
        
        try {
            const symphonyResult = await createBioSymphony(base64Data, mimeType);
            setResult(symphonyResult);
            setSymphonyState('RESULT');
            playAudio(symphonyResult.audioBase64);
        } catch (err) {
            console.error("Bio-Symphony error:", err);
            setError("The AI could not interpret the moment. Please try again.");
            setSymphonyState('ERROR');
        }
    };

    const handleReset = () => {
        stopCamera();
        setSymphonyState('IDLE');
        setResult(null);
        setError(null);
    };
    
    useEffect(() => {
        // Cleanup camera on unmount
        return () => stopCamera();
    }, [stopCamera]);

    return (
        <motion.div
            className="w-full md:max-w-5xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
             <div className="flex-shrink-0 text-center mb-6">
                <div className="inline-block p-4 bg-pink-500/20 rounded-full mb-2">
                    <BioSymphonyIcon className="h-10 w-10 text-pink-300" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">Bio-Symphony</h1>
                <p className="text-sm md:text-base text-gray-300">A collaborative creation between you and AI.</p>
            </div>
            
            <div className="flex-grow flex items-center justify-center relative">
                <canvas ref={canvasRef} className="hidden" />
                 <AnimatePresence mode="wait">
                    {symphonyState === 'IDLE' && (
                        <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center">
                             <p className="max-w-md mb-6">This experience will analyze your facial expression to generate a unique piece of art and a spoken-word poem reflecting your current emotional state.</p>
                             <motion.button
                                onClick={handleStart}
                                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg shadow-lg"
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            >
                                Begin Symphony
                            </motion.button>
                        </motion.div>
                    )}
                    {symphonyState === 'CAM_ACTIVE' && (
                         <motion.div key="cam" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex flex-col items-center">
                            <video ref={videoRef} autoPlay playsInline className="rounded-lg shadow-2xl border-2 border-white/10 w-full max-w-lg" />
                             <motion.button
                                onClick={handleCapture}
                                className="mt-4 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg"
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            >
                                Capture & Analyze
                            </motion.button>
                        </motion.div>
                    )}
                    {symphonyState === 'ANALYZING' && (
                         <motion.div key="analyzing" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center">
                            <LoadingSpinner />
                            <p className="mt-4 text-pink-300 text-lg transition-opacity duration-500">{loadingMessage}</p>
                        </motion.div>
                    )}
                     {(symphonyState === 'RESULT' && result) && (
                         <motion.div key="result" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="w-full h-full flex flex-col md:flex-row gap-6">
                             <div className="w-full md:w-3/5 flex items-center justify-center bg-black/20 rounded-lg p-2">
                                <img src={result.imageUrl} alt="Generated art" className="max-w-full max-h-full object-contain rounded-md" />
                             </div>
                             <div className="w-full md:w-2/5 flex flex-col items-center justify-center text-center bg-black/20 rounded-lg p-4">
                                <p className="text-lg italic text-gray-200 whitespace-pre-wrap mb-4">"{result.poem}"</p>
                                <button onClick={() => playAudio(result.audioBase64)} className="p-3 rounded-full bg-pink-500/30 hover:bg-pink-500/50">
                                    <SpeakerWaveIcon />
                                </button>
                             </div>
                         </motion.div>
                    )}
                    {symphonyState === 'ERROR' && (
                        <motion.div key="error" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-center">
                            <p className="text-red-400 mb-4">{error}</p>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </div>

            <div className="flex-shrink-0 pt-4 text-center h-12">
                 {(symphonyState === 'RESULT' || symphonyState === 'ERROR') && (
                     <motion.button
                        onClick={handleReset}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="px-6 py-2 bg-gray-600 rounded-lg shadow-lg hover:bg-gray-500 transition-colors"
                     >
                        Create Another Symphony
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default BioSymphony;