import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chat } from "@google/genai";
import { generateAvatar, createPersonaChat } from '../services/geminiService';
import { LoadingSpinner, EchoForgeIcon, MagicWandIcon, SendIcon } from './Icons';

type Persona = {
    id: string;
    name: string;
    avatarUrl: string;
    description: string;
    systemInstruction: string;
};

type View = 'LIST' | 'CREATE' | 'CHAT';
const PERSONAS_STORAGE_KEY = 'sagex-echo-forge-personas';

const EchoForge: React.FC = () => {
    const [view, setView] = useState<View>('LIST');
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [activePersona, setActivePersona] = useState<Persona | null>(null);

    useEffect(() => {
        try {
            const savedPersonas = localStorage.getItem(PERSONAS_STORAGE_KEY);
            if (savedPersonas) {
                setPersonas(JSON.parse(savedPersonas));
            }
        } catch (error) {
            console.error("Failed to load personas from localStorage", error);
        }
    }, []);

    const savePersonas = (updatedPersonas: Persona[]) => {
        setPersonas(updatedPersonas);
        localStorage.setItem(PERSONAS_STORAGE_KEY, JSON.stringify(updatedPersonas));
    };

    const handleSavePersona = (persona: Persona) => {
        savePersonas([...personas, persona]);
        setView('LIST');
    };

    const handleDeletePersona = (id: string) => {
        savePersonas(personas.filter(p => p.id !== id));
    };

    const handleStartChat = (persona: Persona) => {
        setActivePersona(persona);
        setView('CHAT');
    };
    
    const renderContent = () => {
        switch (view) {
            case 'CREATE':
                return <CreateView onSave={handleSavePersona} onBack={() => setView('LIST')} />;
            case 'CHAT':
                return activePersona && <ChatView persona={activePersona} onBack={() => setView('LIST')} />;
            case 'LIST':
            default:
                return <ListView personas={personas} onStartChat={handleStartChat} onCreateNew={() => setView('CREATE')} onDelete={handleDeletePersona} />;
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
                <div className="inline-block p-4 bg-gray-500/20 rounded-full mb-2">
                    <EchoForgeIcon className="h-10 w-10 text-gray-300" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-300 to-white">Echo Forge</h1>
                <p className="text-sm md:text-base text-gray-300">Design, create, and converse with your own AI personas.</p>
            </div>
            <div className="flex-grow relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                         {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// --- List View ---
const ListView: React.FC<{ personas: Persona[], onStartChat: (p: Persona) => void, onCreateNew: () => void, onDelete: (id: string) => void }> = ({ personas, onStartChat, onCreateNew, onDelete }) => {
    return (
        <div className="h-full flex flex-col">
            {personas.length === 0 ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <p className="text-gray-400 mb-4">The Forge is quiet. Create your first AI persona to begin.</p>
                    <button onClick={onCreateNew} className="px-6 py-3 bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-500 transition-colors">Forge New Persona</button>
                 </div>
            ) : (
                <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pr-2">
                    {personas.map(p => (
                        <div key={p.id} className="group relative bg-black/20 p-3 rounded-lg border border-white/10 flex flex-col items-center text-center cursor-pointer" onClick={() => onStartChat(p)}>
                             <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full text-white text-xs z-10 opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                            <img src={p.avatarUrl} alt={p.name} className="w-24 h-24 rounded-full object-cover mb-2 border-2 border-white/20"/>
                            <h3 className="font-bold text-sm">{p.name}</h3>
                            <p className="text-xs text-gray-400 truncate">{p.description}</p>
                        </div>
                    ))}
                     <button onClick={onCreateNew} className="bg-black/20 p-4 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="text-3xl">+</span>
                        <span className="text-sm">Forge New</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Create View ---
const CreateView: React.FC<{ onSave: (p: Persona) => void, onBack: () => void }> = ({ onSave, onBack }) => {
    const [formData, setFormData] = useState({ name: '', description: '', systemInstruction: '' });
    const [avatarPrompt, setAvatarPrompt] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarLoading, setAvatarLoading] = useState(false);

    const handleGenerateAvatar = async () => {
        if (!avatarPrompt.trim()) return;
        setAvatarLoading(true);
        try {
            const url = await generateAvatar(avatarPrompt);
            setAvatarUrl(url);
        } catch (error) {
            console.error("Avatar generation failed", error);
        } finally {
            setAvatarLoading(false);
        }
    };
    
    const handleSave = () => {
        if (!formData.name || !formData.systemInstruction || !avatarUrl) {
            // Add some user feedback here
            return;
        }
        onSave({ ...formData, id: Date.now().toString(), avatarUrl });
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
                <div className="w-48 h-48 rounded-full bg-black/20 border-2 border-dashed border-white/20 flex items-center justify-center">
                    {avatarLoading ? <LoadingSpinner /> : avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover rounded-full" /> : <p className="text-xs text-gray-500">Avatar</p>}
                </div>
                <input type="text" value={avatarPrompt} onChange={e => setAvatarPrompt(e.target.value)} placeholder="Describe avatar..." className="w-full bg-black/30 p-2 rounded-md text-sm border border-white/10" />
                <button onClick={handleGenerateAvatar} disabled={avatarLoading} className="w-full p-2 bg-purple-600 rounded-md text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {avatarLoading ? <LoadingSpinner /> : <><MagicWandIcon className="w-4 h-4" /> Generate Avatar</>}
                </button>
            </div>
            <div className="w-full md:w-2/3 flex flex-col gap-3">
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Persona Name" className="w-full bg-black/30 p-2 rounded-md border border-white/10" />
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Short Description (e.g., 'Cynical Pirate Captain')" className="w-full bg-black/30 p-2 rounded-md border border-white/10" />
                <textarea value={formData.systemInstruction} onChange={e => setFormData({...formData, systemInstruction: e.target.value})} placeholder="Full Persona Definition & System Instruction..." className="w-full flex-grow bg-black/30 p-2 rounded-md border border-white/10 resize-none"></textarea>
                <div className="flex gap-4">
                    <button onClick={onBack} className="flex-1 p-2 bg-gray-600 rounded-md">Back</button>
                    <button onClick={handleSave} className="flex-1 p-2 bg-green-600 rounded-md">Forge Persona</button>
                </div>
            </div>
        </div>
    );
};

// --- Chat View ---
const ChatView: React.FC<{ persona: Persona, onBack: () => void }> = ({ persona, onBack }) => {
    const [messages, setMessages] = useState<{id: string, role: 'user' | 'model', text: string}[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        chatRef.current = createPersonaChat(persona.systemInstruction);
    }, [persona]);
    
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading || !chatRef.current) return;
        
        const currentInput = userInput;
        setUserInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: currentInput }]);
        setIsLoading(true);

        try {
            const response = await chatRef.current.sendMessage({ message: currentInput });
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: response.text }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: "An error occurred while communicating." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex items-center gap-4 p-2 border-b border-white/10">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-md">&larr; Back</button>
                <img src={persona.avatarUrl} alt={persona.name} className="w-10 h-10 rounded-full object-cover"/>
                <div>
                    <h3 className="font-bold">{persona.name}</h3>
                    <p className="text-xs text-gray-400">{persona.description}</p>
                </div>
            </div>
             <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 my-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <img src={persona.avatarUrl} className="w-8 h-8 rounded-full flex-shrink-0" />}
                        <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800/80'}`}>
                            <p className="text-sm text-white whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start gap-3 my-4">
                        <img src={persona.avatarUrl} className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="max-w-md p-3 rounded-2xl bg-gray-800/80 flex items-center"><LoadingSpinner /></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
             <div className="p-2 border-t border-white/10">
                <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
                    <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Chat with ${persona.name}...`} className="flex-1 bg-transparent focus:outline-none text-white px-2" disabled={isLoading} />
                    <button onClick={handleSend} disabled={isLoading || !userInput} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 disabled:bg-gray-600"><SendIcon /></button>
                </div>
            </div>
        </div>
    );
};


export default EchoForge;