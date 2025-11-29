import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLaptopRecommendation, getLaptopChatResponse } from '../services/geminiService';
import { Message, Laptop } from '../types';
import { LoadingSpinner, SendIcon, ChatIcon, MagicWandIcon, LaptopsIcon } from './Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialLaptops } from '../data/initialData';

const LaptopsPage: React.FC = () => {
    const [laptops] = useLocalStorage<Laptop[]>('laptops', initialLaptops);
    const [selectedLaptop, setSelectedLaptop] = useState(laptops[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isChatLoading, setChatLoading] = useState(false);
    const [isRecLoading, setRecLoading] = useState(false);
    const [userNeeds, setUserNeeds] = useState('');
    const [recommendation, setRecommendation] = useState<{ id: string, reasoning: string } | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If the selected laptop is deleted, select the first available one.
        if (!laptops.find(l => l.id === selectedLaptop?.id)) {
            setSelectedLaptop(laptops[0]);
        }
    }, [laptops, selectedLaptop]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!userInput.trim() || isChatLoading) return;

        const newUserMessage: Message = { id: Date.now().toString(), role: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        const currentInput = userInput;
        setUserInput('');
        setChatLoading(true);

        try {
            const response = await getLaptopChatResponse(messages, currentInput, laptops);
            const modelMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response.text,
            };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error('Laptop chat error:', error);
            const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: 'Sorry, my circuits are a bit scrambled. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleRecommendation = async () => {
        if (!userNeeds.trim() || isRecLoading) return;
        setRecLoading(true);
        setRecommendation(null);
        try {
            const result = await getLaptopRecommendation(userNeeds, laptops);
            const recommendedProduct = laptops.find(p => p.id === result.recommendedLaptopId);
            if (recommendedProduct) {
                setRecommendation({ id: recommendedProduct.id, reasoning: result.reasoning });
                setSelectedLaptop(recommendedProduct);
            }
        } catch (error) {
            console.error("Recommendation error:", error);
            // Handle error in UI
        } finally {
            setRecLoading(false);
        }
    }

    return (
        <motion.div
            className="w-full max-w-7xl min-h-[85vh] flex flex-col md:flex-row gap-6 bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Left Panel */}
            <div className="w-full md:w-2/5 flex flex-col gap-4">
                <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <LaptopsIcon />
                        <h2 className="text-xl font-bold">Laptop Selection</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {laptops.map(laptop => (
                            <motion.div
                                key={laptop.id}
                                onClick={() => setSelectedLaptop(laptop)}
                                className={`cursor-pointer rounded-lg border-2 p-2 transition-all ${selectedLaptop?.id === laptop.id ? 'border-purple-500' : 'border-transparent hover:border-white/50'}`}
                                whileHover={{ scale: 1.05 }}
                            >
                                <img src={laptop.imageUrl} alt={laptop.name} className="w-full h-auto rounded-md aspect-video object-cover" />
                                <p className="text-xs mt-1 font-semibold truncate">{laptop.name}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
                 <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                         <MagicWandIcon />
                        <h2 className="text-xl font-bold">AI Recommender</h2>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">Describe what you need, and I'll find the best fit.</p>
                    <textarea
                        value={userNeeds}
                        onChange={(e) => setUserNeeds(e.target.value)}
                        placeholder="e.g., 'I need a lightweight laptop for college with a great battery life for coding and watching movies.'"
                        className="w-full bg-black/30 rounded-lg p-2 border border-white/10 focus:ring-2 focus:ring-purple-500 focus:outline-none text-white text-sm"
                        rows={3}
                        disabled={isRecLoading}
                    />
                     <button onClick={handleRecommendation} disabled={isRecLoading || !userNeeds} className="w-full mt-2 py-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600 flex justify-center items-center">
                        {isRecLoading ? <LoadingSpinner /> : "Find My Laptop"}
                    </button>
                    {recommendation && (
                        <motion.div 
                            className="mt-3 bg-purple-500/10 p-3 rounded-lg border border-purple-500/30"
                            initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}}
                        >
                            <p className="text-sm text-purple-200">{recommendation.reasoning}</p>
                        </motion.div>
                    )}
                </div>
            </div>
            
            {/* Right Panel */}
            <div className="w-full md:w-3/5 flex flex-col gap-4">
                 <div className="bg-black/20 p-4 rounded-lg border border-white/10 flex-grow">
                     <AnimatePresence mode="wait">
                         {selectedLaptop ? (
                            <motion.div
                                key={selectedLaptop.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <img src={selectedLaptop.imageUrl} alt={selectedLaptop.name} className="w-full h-auto rounded-lg shadow-lg aspect-video object-cover mb-4" />
                                <h1 className="text-3xl font-bold">{selectedLaptop.name}</h1>
                                <p className="text-2xl text-purple-400 font-semibold">${selectedLaptop.price}</p>
                                <ul className="mt-4 space-y-1 text-sm text-gray-300">
                                    {Object.entries(selectedLaptop.specs).map(([key, value]) => (
                                        <li key={key}><strong className="capitalize text-white">{key}:</strong> {value}</li>
                                    ))}
                                </ul>
                            </motion.div>
                         ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                No laptops available. Please add some in the admin panel.
                            </div>
                         )}
                     </AnimatePresence>
                </div>
                <div className="bg-black/20 rounded-lg border border-white/10 flex flex-col h-[350px]">
                     <h2 className="text-lg font-bold p-3 border-b border-white/10 flex items-center gap-2"><ChatIcon className="w-6 h-6"/> AI Sales Chat</h2>
                    <div className="flex-1 p-3 overflow-y-auto">
                        {messages.length === 0 && (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <p>Ask me anything about these laptops!</p>
                            </div>
                        )}
                        {messages.map(msg => (
                             <div key={msg.id} className={`flex gap-2 my-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-purple-500 flex-shrink-0" />}
                                <div className={`max-w-xs p-2.5 rounded-xl text-sm ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                         {isChatLoading && (
                            <div className="flex justify-start gap-2 my-2">
                                <div className="w-6 h-6 rounded-full bg-purple-500 flex-shrink-0" />
                                <div className="p-2.5 rounded-xl bg-gray-800"><LoadingSpinner /></div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                     <div className="p-2 border-t border-white/10">
                        <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1.5">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="e.g., 'Which is better for gaming?'"
                                className="flex-1 bg-transparent focus:outline-none text-white px-2 text-sm"
                                disabled={isChatLoading}
                            />
                            <button onClick={handleSend} disabled={isChatLoading || !userInput} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600">
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default LaptopsPage;