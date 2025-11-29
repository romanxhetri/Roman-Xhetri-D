import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Chat } from "@google/genai";
import { generateAnomaly, createAnomalyChat, generateImageFromPrompt } from '../services/geminiService';
import { LoadingSpinner, TemporalInvestigatorIcon, SendIcon } from './Icons';

interface Anomaly {
    case_file: string;
    image_prompt: string;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

const TemporalInvestigator: React.FC = () => {
    const [anomaly, setAnomaly] = useState<Anomaly | null>(null);
    const [anomalyImage, setAnomalyImage] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState<'anomaly' | 'chat' | false>(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const startNewInvestigation = async () => {
        setIsLoading('anomaly');
        setAnomaly(null);
        setAnomalyImage(null);
        setMessages([]);
        setUserInput('');
        chatRef.current = null;

        try {
            const newAnomaly = await generateAnomaly();
            setAnomaly(newAnomaly);

            const imageUrl = await generateImageFromPrompt(newAnomaly.image_prompt, '4:3');
            setAnomalyImage(imageUrl);

            chatRef.current = createAnomalyChat();
            const initialMessage = `Good day, Agent. I've compiled the preliminary file on the anomaly. What is your assessment?`;
            setMessages([{ id: 'init-1', role: 'model', text: initialMessage }]);

        } catch (error) {
            console.error("Failed to start new investigation:", error);
            setMessages([{ id: 'error-1', role: 'model', text: "There seems to be an interference on the chronostream, Agent. I cannot retrieve the anomaly data." }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startNewInvestigation();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading || !chatRef.current) return;

        const currentInput = userInput;
        setUserInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: currentInput }]);
        setIsLoading('chat');

        try {
            const response = await chatRef.current.sendMessage({ message: currentInput });
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: response.text }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: "Static on the line, Agent. Please repeat your query." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="w-full md:max-w-6xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 text-center mb-4">
                <div className="inline-block p-4 bg-amber-500/20 rounded-full mb-2">
                    <TemporalInvestigatorIcon className="h-10 w-10 text-amber-300" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-400">Temporal Investigator</h1>
                <p className="text-sm md:text-base text-gray-300">Analyze the timeline. Identify the paradox. Restore integrity.</p>
            </div>
            
            <AnimatePresence mode="wait">
            {isLoading === 'anomaly' ? (
                <motion.div key="loading" className="flex-grow flex flex-col items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <LoadingSpinner />
                    <p className="mt-2 text-amber-300">Scanning timelines for anomalies...</p>
                </motion.div>
            ) : (
                <motion.div key="content" className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    {/* Left Panel: Anomaly Data */}
                    <div className="lg:col-span-5 flex flex-col gap-4">
                        <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                            <h2 className="text-lg font-bold text-amber-300 mb-2">Anomaly Evidence</h2>
                            <div className="aspect-w-4 aspect-h-3 bg-black rounded-md flex items-center justify-center">
                                {anomalyImage ? <img src={anomalyImage} alt="Temporal Anomaly" className="w-full h-full object-contain rounded" /> : <LoadingSpinner />}
                            </div>
                        </div>
                         <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                            <h2 className="text-lg font-bold text-amber-300 mb-2">Case File</h2>
                            <p className="text-sm text-gray-300 italic">{anomaly?.case_file}</p>
                        </div>
                        <button onClick={startNewInvestigation} disabled={!!isLoading} className="w-full p-2 bg-amber-600 rounded-lg hover:bg-amber-500 transition-colors">
                            Request New Anomaly
                        </button>
                    </div>

                    {/* Right Panel: Chat with A.R.I.A. */}
                    <div className="lg:col-span-7 flex flex-col min-h-0 h-full">
                        <div className="bg-black/20 rounded-lg border border-white/10 flex flex-col h-full min-h-[400px] lg:min-h-0">
                            <h2 className="text-lg font-bold p-3 border-b border-white/10 text-amber-300">A.R.I.A. Comms</h2>
                            <div className="flex-1 p-3 overflow-y-auto">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex gap-3 my-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-amber-500 flex-shrink-0" />}
                                        <div className={`max-w-md p-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800/80'}`}>
                                            <p className="text-white whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading === 'chat' && (
                                    <div className="flex justify-start gap-3 my-3">
                                        <div className="w-8 h-8 rounded-full bg-amber-500 flex-shrink-0" />
                                        <div className="p-2.5 rounded-2xl bg-gray-800/80"><LoadingSpinner /></div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-2 border-t border-white/10">
                                <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1.5">
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={e => setUserInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                        placeholder="Query A.R.I.A..."
                                        className="flex-1 bg-transparent focus:outline-none text-white px-2 text-sm"
                                        disabled={!!isLoading}
                                    />
                                    <button onClick={handleSend} disabled={!!isLoading || !userInput} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:bg-gray-600">
                                        <SendIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
};

export default TemporalInvestigator;
