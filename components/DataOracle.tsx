import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataOracleIcon, UploadIcon, LoadingSpinner, SendIcon } from './Icons';
import { getDataAnalysisResponse } from '../services/geminiService';
import { Message } from '../types';

const DataOracle: React.FC = () => {
    const [csvData, setCsvData] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    const handleFileUpload = (file: File | null) => {
        if (!file) return;

        if (file.type !== 'text/csv') {
            setError('Please upload a valid CSV file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setCsvData(text);
            setFileName(file.name);
            setError(null);
            setMessages([
                { id: '1', role: 'model', text: `Successfully loaded **${file.name}**. I am ready to analyze the data. What would you like to know?` }
            ]);
        };
        reader.readAsText(file);
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        handleFileUpload(event.dataTransfer.files[0]);
    }, []);

    const handleSend = async () => {
        if (!userInput.trim() || !csvData || isLoading) return;

        const newUserMessage: Message = { id: Date.now().toString(), role: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await getDataAnalysisResponse(csvData, currentInput);
            const modelMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response.text,
            };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error('Error fetching data analysis response:', error);
            const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: '🔮 My apologies, but my connection to the data streams is weak. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="w-full md:max-w-5xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 flex items-center gap-4 mb-4 text-center justify-center">
                 <div className="p-2 bg-teal-500/20 rounded-full">
                    <DataOracleIcon className="h-10 w-10 text-teal-300" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">Data Oracle</h1>
                    <p className="text-sm text-gray-300">Unlock insights from your data with the power of AI.</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
            {!csvData ? (
                <motion.div key="upload" className="flex-grow flex flex-col items-center justify-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    <label 
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-500 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        <UploadIcon className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg text-center">Drop your CSV file here or click to upload</p>
                        <p className="text-sm text-gray-500 mt-1">Your data remains on your device.</p>
                        <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileUpload(e.target.files ? e.target.files[0] : null)} />
                    </label>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </motion.div>
            ) : (
                <motion.div key="chat" className="flex-grow flex flex-col min-h-0" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                     <div className="flex-1 p-4 overflow-y-auto bg-black/20 rounded-t-lg border border-white/10">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-teal-500 flex-shrink-0" />}
                                <div className={`max-w-xl p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800/80'}`}>
                                    <div className="prose prose-sm prose-invert max-w-none prose-p:text-white whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}/>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start gap-3 my-4">
                                <div className="w-8 h-8 rounded-full bg-teal-500 flex-shrink-0" />
                                <div className="max-w-md p-3 rounded-2xl bg-gray-800/80 flex items-center">
                                    <LoadingSpinner />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                     <div className="p-3 border-t border-white/10 bg-black/30 rounded-b-lg">
                        <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={`Ask a question about ${fileName}...`}
                                className="flex-1 bg-transparent focus:outline-none text-white px-2"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading || !userInput} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600">
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
};

export default DataOracle;