import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getChatResponse, generateSpeech } from '../services/geminiService';
import { Message, GroundingChunk } from '../types';
import { SendIcon, LoadingSpinner, MicIcon, VideoIcon, ShareIcon, LinkIcon, SpeakerWaveIcon, SpeakerMuteIcon } from './Icons';
import { NAV_ITEMS } from '../constants';

const CHAT_HISTORY_KEY = 'sagex-chat-history';

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


const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        if (savedHistory) {
            const parsedHistory = JSON.parse(savedHistory);
            if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
                return parsedHistory;
            }
        }
    } catch (error) {
        console.error('Failed to load chat history from localStorage', error);
    }
    return [
      { id: '1', role: 'model', text: 'Hello there! I am SageX, your mystical guide in this universe. What adventure shall we embark on today? ✨ You can ask me to navigate the app, for example "take me to the code wizard".' }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Removed automatic location request
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopPlayback = () => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
        audioSourceRef.current = null;
    }
    setCurrentlyPlayingId(null);
  };
  
  const handlePlayAudio = async (message: Message) => {
    if (currentlyPlayingId === message.id) {
        stopPlayback();
        return;
    }
    
    stopPlayback(); // Stop any currently playing audio
    setTtsLoadingId(message.id);
    
    try {
      // Use 'Kore' for a female voice
      const base64Audio = await generateSpeech(message.text, 'Kore');
      
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const buffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);

      source.onended = () => {
          setCurrentlyPlayingId(null);
          audioSourceRef.current = null;
      };
      
      audioSourceRef.current = source;
      setCurrentlyPlayingId(message.id);

    } catch (error) {
        console.error("TTS Error:", error);
        // Optionally show an error to the user
    } finally {
        setTtsLoadingId(null);
    }
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history to localStorage', error);
    }
  }, [messages]);

  useEffect(() => {
    // Cleanup audio on component unmount
    return () => {
        stopPlayback();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
    };
  }, []);


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    stopPlayback();

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, newUserMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = messages.map(({ role, text }) => ({ role, text })) as Message[];
      const response = await getChatResponse(historyForApi, currentInput, location);
      
      if (response.functionCalls) {
        for (const fc of response.functionCalls) {
          if (fc.name === 'navigateApp' && fc.args.view) {
            const view = fc.args.view as string;
            const navItem = NAV_ITEMS.find(item => item.view === view);
            const viewName = navItem ? navItem.label : view;
            
            const commandEvent = new CustomEvent('sagex-command', {
              detail: { command: 'navigate', payload: { view } }
            });
            window.dispatchEvent(commandEvent);
            
            const modelMessage: Message = { 
              id: (Date.now() + 1).toString(), 
              role: 'model', 
              text: `On my way to the ${viewName} section! 🚀 Let me know when you're ready for more fun!`,
            };
            setMessages(prev => [...prev, modelMessage]);
            setIsLoading(false);
            return; 
          }
        }
      }

      const metadata = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const modelMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text,
        sources: metadata as GroundingChunk[] | undefined,
      };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error('Error fetching chat response:', error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: 'Oops! My crystal ball seems to be foggy. 🔮 Please try again later.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
        className="w-full md:max-w-4xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div className="flex-1 p-2 sm:p-6 overflow-y-auto">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`flex gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 mt-2" />}
              <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800/80'}`}>
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-sm text-white whitespace-pre-wrap">{msg.text}</p>
                   <button onClick={() => handlePlayAudio(msg)} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                        {ttsLoadingId === msg.id ? (
                            <LoadingSpinner />
                        ) : currentlyPlayingId === msg.id ? (
                            <SpeakerWaveIcon />
                        ) : (
                            <SpeakerMuteIcon />
                        )}
                    </button>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <h4 className="text-xs font-bold text-purple-300 mb-2">Sources:</h4>
                    <ul className="space-y-2">
                      {msg.sources.map((source, index) => (
                        <li key={index}>
                          {source.web &&
                            <a
                              href={source.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-300 hover:underline flex items-center gap-1.5"
                            >
                              <LinkIcon />
                              <span className="truncate">{source.web.title || 'Web Link'}</span>
                            </a>
                          }
                          {source.maps &&
                            <>
                              <a
                                href={source.maps.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-300 hover:underline flex items-center gap-1.5"
                              >
                                <LinkIcon />
                                <span className="truncate">{source.maps.title || 'Map Link'}</span>
                              </a>
                              {source.maps.placeAnswerSources?.reviewSnippets?.map((review, rIndex) => (
                                <div key={`review-${rIndex}`} className="mt-1.5 pl-2 border-l-2 border-purple-400">
                                    <a href={review.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-indigo-300 italic">
                                        "{review.text}"
                                    </a>
                                </div>
                              ))}
                            </>
                          }
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start gap-3 my-4">
            <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0" />
            <div className="max-w-md p-3 rounded-2xl bg-gray-800/80 flex items-center">
              <LoadingSpinner />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 sm:p-4 border-t border-white/10">
        <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
            <button className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block"><MicIcon/></button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block"><VideoIcon/></button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block"><ShareIcon/></button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask SageX anything..."
            className="flex-1 bg-transparent focus:outline-none text-white px-2"
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600">
            <SendIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatInterface;