
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { LoadingSpinner, MicIcon } from './Icons';
import { API_KEY } from '../services/geminiService';

// --- Audio Helper Functions ---
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
// --- End Helper Functions ---

type TranscriptionEntry = {
    id: string;
    speaker: 'user' | 'model';
    text: string;
    isFinal: boolean;
};

enum ConnectionState {
    IDLE = 'IDLE',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    SPEAKING = 'SPEAKING',
    ERROR = 'ERROR',
    CLOSED = 'CLOSED',
}

const LiveConversation: React.FC = () => {
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.IDLE);
    const [transcriptions, setTranscriptions] = useState<TranscriptionEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const audioContextRefs = useRef<{ input: AudioContext | null, output: AudioContext | null, outputSources: Set<AudioBufferSourceNode> }>({
        input: null,
        output: null,
        outputSources: new Set(),
    });
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const transcriptionLogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(transcriptionLogRef.current) {
            transcriptionLogRef.current.scrollTop = transcriptionLogRef.current.scrollHeight;
        }
    }, [transcriptions]);

    const stopAudioPlayback = () => {
        if (audioContextRefs.current.outputSources) {
            for (const source of audioContextRefs.current.outputSources.values()) {
                source.stop();
            }
            audioContextRefs.current.outputSources.clear();
        }
        nextStartTimeRef.current = 0;
    };

    const stopConversation = useCallback(async () => {
        setConnectionState(ConnectionState.CLOSED);
        stopAudioPlayback();

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }

        if (audioContextRefs.current.input) {
            await audioContextRefs.current.input.close();
            audioContextRefs.current.input = null;
        }
        if (audioContextRefs.current.output) {
            await audioContextRefs.current.output.close();
            audioContextRefs.current.output = null;
        }
        
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing session:", e)
            } finally {
                sessionPromiseRef.current = null;
            }
        }
    }, []);

    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    const startConversation = async () => {
        setError(null);
        setTranscriptions([]);
        setConnectionState(ConnectionState.CONNECTING);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Use the hardcoded API_KEY exported from geminiService
            const ai = new GoogleGenAI({ apiKey: API_KEY });

            audioContextRefs.current.input = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRefs.current.output = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                    systemInstruction: 'You are SageX, a friendly and witty AI assistant. Keep your responses concise.',
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setConnectionState(ConnectionState.CONNECTED);
                        const inputCtx = audioContextRefs.current.input!;
                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const { text, isFinal } = message.serverContent.inputTranscription;
                             setTranscriptions(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.speaker === 'user' && !last.isFinal) {
                                    const updatedLast = { ...last, text, isFinal };
                                    return [...prev.slice(0, -1), updatedLast];
                                }
                                return [...prev, { id: `user-${Date.now()}`, speaker: 'user', text, isFinal }];
                            });
                        } else if (message.serverContent?.outputTranscription) {
                            const { text, isFinal } = message.serverContent.outputTranscription;
                            setTranscriptions(prev => {
                                const last = prev[prev.length - 1];
                                if (last && last.speaker === 'model' && !last.isFinal) {
                                    const updatedLast = { ...last, text, isFinal };
                                    return [...prev.slice(0, -1), updatedLast];
                                }
                                return [...prev, { id: `model-${Date.now()}`, speaker: 'model', text, isFinal }];
                            });
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && audioContextRefs.current.output) {
                            setConnectionState(ConnectionState.SPEAKING);
                            const outputCtx = audioContextRefs.current.output;
                            
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputCtx.destination);
                            
                            source.addEventListener('ended', () => {
                                audioContextRefs.current.outputSources.delete(source);
                                if (audioContextRefs.current.outputSources.size === 0) {
                                   setConnectionState(prev => {
                                        if (prev === ConnectionState.SPEAKING) {
                                            return ConnectionState.CONNECTED;
                                        }
                                        return prev;
                                   });
                                }
                            });
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioContextRefs.current.outputSources.add(source);
                        }
                        
                        if(message.serverContent?.interrupted) {
                            stopAudioPlayback();
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        setError('A connection error occurred. Please try again.');
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        stopConversation();
                    },
                }
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (err) {
            console.error('Failed to start conversation:', err);
            setError('Could not access microphone. Please check permissions.');
            setConnectionState(ConnectionState.ERROR);
        }
    };
    
    const renderStatus = () => {
        switch (connectionState) {
            case ConnectionState.IDLE: return "Press the button to start a conversation.";
            case ConnectionState.CONNECTING: return "Connecting to the cosmos...";
            case ConnectionState.CONNECTED: return "Connected. I'm listening...";
            case ConnectionState.SPEAKING: return "I'm speaking...";
            case ConnectionState.CLOSED: return "Conversation ended.";
            case ConnectionState.ERROR: return "Connection failed.";
            default: return "";
        }
    }

    const isSessionActive = connectionState === ConnectionState.CONNECTING || connectionState === ConnectionState.CONNECTED || connectionState === ConnectionState.SPEAKING;

    return (
        <motion.div
            className="w-full md:max-w-4xl md:min-h-[75vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 text-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">Live Conversation</h1>
                <p className="text-gray-300 text-sm md:text-base">Speak directly with SageX in real-time.</p>
            </div>
            
            <div ref={transcriptionLogRef} className="flex-1 overflow-y-auto bg-black/20 rounded-lg p-4 border border-white/10 mb-4">
                {transcriptions.map((entry) => (
                    <div key={entry.id} className={`flex my-2 ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <p className={`max-w-md p-2 rounded-lg text-sm ${entry.speaker === 'user' ? 'bg-indigo-600' : 'bg-gray-700'} ${!entry.isFinal ? 'opacity-70' : ''}`}>
                            <span className="font-bold capitalize">{entry.speaker === 'model' ? 'SageX' : 'You'}: </span>{entry.text}
                        </p>
                    </div>
                ))}
                {!transcriptions.length && (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        Transcription will appear here...
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
                <motion.button
                    onClick={isSessionActive ? stopConversation : startConversation}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg hover:shadow-purple-500/50 transition-all"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={connectionState === ConnectionState.CONNECTING}
                >
                    {connectionState === ConnectionState.CONNECTING ? <LoadingSpinner /> : <MicIcon />}
                </motion.button>
                <p className="text-gray-300 h-5">{renderStatus()}</p>
                {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
        </motion.div>
    );
};

export default LiveConversation;
