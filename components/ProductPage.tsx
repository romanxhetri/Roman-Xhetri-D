import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFashionChatResponse } from '../services/geminiService';
import { Message, Product } from '../types';
import { LoadingSpinner, SendIcon, ChatIcon, ProductIcon } from './Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { initialProducts } from '../data/initialData';

const ProductPage: React.FC = () => {
    const [products] = useLocalStorage<Product[]>('products', initialProducts);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isChatLoading, setChatLoading] = useState(false);
    const [isChatOpen, setChatOpen] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

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
            const response = await getFashionChatResponse(messages, currentInput, products);
            const modelMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: response.text,
            };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error('Fashion chat error:', error);
            const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: 'Sorry, my fashion sense is a bit off today. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setChatLoading(false);
        }
    };
    
    const toggleChat = () => {
        setChatOpen(!isChatOpen);
        if (!isChatOpen && messages.length === 0) {
            setMessages([{ id: '1', role: 'model', text: 'Hello, fashionista! 🛍️ Looking for something special today? Ask me for recommendations or style tips!'}]);
        }
    };

    return (
        <motion.div
            className="w-full max-w-7xl min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="text-center mb-6">
                 <div className="inline-block p-3 bg-blue-500/20 rounded-full mb-2">
                    <ProductIcon className="h-8 w-8 text-blue-300" />
                </div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">SageX Fashion Store</h1>
                <p className="text-gray-300">AI-Powered virtual try-on and style assistant.</p>
            </div>
            
            <div className="flex-grow grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 overflow-y-auto pr-2">
                 {products.map(product => (
                    <motion.div key={product.id} className="bg-black/20 rounded-lg border border-white/10 overflow-hidden group"
                        whileHover={{ scale: 1.03, y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}
                    >
                        <div className="aspect-square w-full overflow-hidden">
                             <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold truncate">{product.name}</h3>
                            <p className="text-sm text-gray-400">{product.category}</p>
                            <p className="text-lg font-semibold text-blue-400 mt-2">${product.price}</p>
                        </div>
                    </motion.div>
                 ))}
                 {products.length === 0 && (
                    <div className="col-span-full h-full flex items-center justify-center text-gray-500">
                        <p>The store is empty. An admin needs to add products!</p>
                    </div>
                 )}
            </div>
            
             {/* Chat Bubble */}
             <div className="fixed bottom-6 right-6 z-40">
                <motion.button 
                    onClick={toggleChat}
                    className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-lg flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                >
                    <ChatIcon className="w-8 h-8 text-white"/>
                </motion.button>
             </div>
             
             {/* Chat Window */}
             <AnimatePresence>
             {isChatOpen && (
                 <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-24 right-6 w-full max-w-sm h-[500px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col z-30"
                 >
                     <h2 className="text-lg font-bold p-3 border-b border-white/10 flex items-center justify-between">
                        <span>AI Fashion Assistant</span>
                        <button onClick={toggleChat} className="p-1">&times;</button>
                     </h2>
                    <div className="flex-1 p-3 overflow-y-auto">
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
                                placeholder="e.g., 'What hoodie matches this?'"
                                className="flex-1 bg-transparent focus:outline-none text-white px-2 text-sm"
                                disabled={isChatLoading}
                            />
                            <button onClick={handleSend} disabled={isChatLoading || !userInput} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600">
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

export default ProductPage;