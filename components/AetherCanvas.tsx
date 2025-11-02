import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AetherCanvasIcon, SendIcon, LoadingSpinner } from './Icons';
import { generateComponentCode } from '../services/geminiService';

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: React.ReactNode;
}

const AetherCanvas: React.FC = () => {
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canvasContent, setCanvasContent] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (conversation.length === 0) {
            addMessage('model', "Welcome to the Aether Canvas. Describe a UI component, for example: 'a futuristic login form with a glowing button'. I will generate the code and a visual preview. ✨");
        }
    }, []);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [conversation]);

    const addMessage = (role: 'user' | 'model', content: React.ReactNode) => {
        setConversation(prev => [...prev, { id: Date.now().toString(), role, content }]);
    };

     const updateLastMessage = (content: React.ReactNode) => {
        setConversation(prev => {
            const newConversation = [...prev];
            newConversation[newConversation.length - 1].content = content;
            return newConversation;
        });
    };

    const handleSend = async () => {
        if (!userInput.trim() || isLoading) return;
        
        const currentInput = userInput;
        addMessage('user', currentInput);
        setUserInput('');
        setIsLoading(true);
        addMessage('model', <LoadingSpinner />);

        try {
            const result = await generateComponentCode(currentInput);
            setCanvasContent(result.html);
            updateLastMessage(result.reasoning);
        } catch (error) {
            console.error("Aether Canvas error:", error);
            const errorMessage = error instanceof Error ? error.message : "My creative circuits are fried! Please try again.";
            updateLastMessage(`Oops! I ran into an error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="w-full h-full md:h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-2 md:p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 flex items-center gap-4 mb-4">
                 <div className="p-2 bg-rose-500/20 rounded-full">
                    <AetherCanvasIcon className="h-8 w-8 text-rose-300" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-red-400">Aether Canvas</h1>
                    <p className="text-sm text-gray-300">Your visual playground for AI-driven UI creation.</p>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 overflow-y-auto lg:overflow-y-hidden">
                {/* Canvas Panel */}
                <div className="col-span-1 lg:col-span-8 min-h-[300px] lg:min-h-0 h-full flex flex-col bg-black/20 rounded-lg border border-white/10 p-4">
                    <div className="flex-grow w-full h-full flex items-center justify-center bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] overflow-auto p-4">
                         <AnimatePresence>
                        {canvasContent ? (
                            <motion.div
                                key={canvasContent} // Key change triggers animation
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="w-full h-full flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: canvasContent }} 
                            />
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-gray-500"
                            >
                                <h2 className="text-xl font-medium">Your Creation Will Appear Here</h2>
                                <p className="text-sm">Describe a component in the chat to begin.</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* AI Chat Panel */}
                <div className="col-span-1 lg:col-span-4 min-h-[350px] lg:min-h-0 h-full flex flex-col bg-black/20 rounded-lg border border-white/10">
                    <h2 className="text-md font-semibold p-3 border-b border-white/10 text-gray-300">AI Collaborator</h2>
                    <div ref={chatContainerRef} className="flex-grow p-3 overflow-y-auto space-y-4">
                        {conversation.map((msg) => (
                            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-rose-500 flex-shrink-0 mt-1" />}
                                <div className={`max-w-xs md:max-w-sm p-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800/80'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex-shrink-0 p-3 border-t border-white/10">
                        <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="e.g., 'A sleek pricing card'"
                                className="flex-1 bg-transparent focus:outline-none text-white px-2 text-sm"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading || !userInput} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AetherCanvas;