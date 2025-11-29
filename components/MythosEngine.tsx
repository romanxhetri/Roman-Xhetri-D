import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Chat } from "@google/genai";
import { createMythosChat } from '../services/geminiService';
import { LoadingSpinner, D20Icon, SendIcon } from './Icons';

interface CharacterState {
    hp: number;
    ap: number;
    inventory: string[];
}

interface GameState {
    story: string;
    character: CharacterState;
    gameOver: boolean;
}

const initialGameState: GameState = {
    story: '',
    character: { hp: 100, ap: 10, inventory: [] },
    gameOver: false,
};

const CharacterSheet: React.FC<{ character: CharacterState }> = ({ character }) => (
    <div className="bg-stone-900/50 p-4 rounded-lg border border-amber-400/30 h-full font-serif">
        <h2 className="text-xl font-bold text-amber-300 border-b border-amber-400/30 pb-2 mb-3">Character</h2>
        <div className="space-y-3 text-sm">
            <p><strong>Health:</strong> <span className="text-red-400">{character.hp} HP</span></p>
            <p><strong>Attack:</strong> <span className="text-blue-400">{character.ap} AP</span></p>
            <div>
                <h3 className="font-bold mb-1 text-amber-400">Inventory:</h3>
                {character.inventory.length > 0 ? (
                    <ul className="list-disc list-inside pl-2 text-gray-300">
                        {character.inventory.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                ) : (
                    <p className="text-gray-500 italic">Empty</p>
                )}
            </div>
        </div>
    </div>
);

const MythosEngine: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(initialGameState);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const chatRef = useRef<Chat | null>(null);
    const storyEndRef = useRef<HTMLDivElement>(null);

    const parseAIResponse = (text: string): GameState | null => {
        try {
            const cleanedText = text.replace(/^```json\n/, '').replace(/\n```$/, '');
            const parsed = JSON.parse(cleanedText);
            // Basic validation
            if (parsed.story && parsed.character && typeof parsed.gameOver === 'boolean') {
                return parsed;
            }
            return null;
        } catch (e) {
            console.error("Failed to parse AI JSON response:", text, e);
            return null;
        }
    };

    const startGame = async () => {
        setIsLoading(true);
        chatRef.current = createMythosChat();
        
        try {
            const response = await chatRef.current.sendMessage({ message: "Start a new fantasy adventure for me in a dark forest." });
            const newGameState = parseAIResponse(response.text);

            if (newGameState) {
                setGameState(newGameState);
            } else {
                // Handle error - maybe show a message to the user
                setGameState({ ...initialGameState, story: "The Mythos Engine failed to initialize. Please try refreshing." });
            }
        } catch(e) {
            console.error("Error starting game:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startGame();
    }, []);

    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState.story]);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading || gameState.gameOver) return;

        const currentInput = userInput;
        setUserInput('');
        setIsLoading(true);
        
        setGameState(prev => ({
            ...prev,
            story: prev.story + `\n\n> ${currentInput}`
        }));

        try {
            if (!chatRef.current) throw new Error("Chat session not initialized.");
            
            const response = await chatRef.current.sendMessage({ message: currentInput });
            const newGameState = parseAIResponse(response.text);

            if (newGameState) {
                setGameState(newGameState);
            } else {
                 setGameState(prev => ({ ...prev, story: prev.story + "\n\n[The connection flickered. The world seems to have forgotten your action. Try again.]" }));
            }
        } catch (e) {
            console.error("Error sending message:", e);
             setGameState(prev => ({ ...prev, story: prev.story + "\n\n[A cosmic interference garbled your intent. Please repeat your action.]" }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="w-full md:max-w-6xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
             <div className="flex-shrink-0 text-center mb-4">
                <div className="inline-block p-4 bg-rose-900/50 rounded-full mb-2">
                    <D20Icon className="h-10 w-10 text-rose-300" />
                </div>
                <h1 className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-amber-400 font-serif">Mythos Engine</h1>
                <p className="text-sm md:text-base text-gray-300">An infinite, AI-powered role-playing adventure.</p>
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 min-h-0">
                {/* Character Sheet */}
                <div className="md:col-span-3 min-h-0">
                    <CharacterSheet character={gameState.character} />
                </div>

                {/* Story and Input */}
                <div className="md:col-span-9 flex flex-col min-h-0 h-full">
                    <div className="flex-grow overflow-y-auto bg-stone-900/50 p-4 rounded-t-lg border border-amber-400/30 min-h-[200px] md:min-h-0">
                        <AnimatePresence>
                            {isLoading && gameState.story.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-amber-200">
                                    <LoadingSpinner />
                                    <p className="mt-2 font-serif">Forging your destiny...</p>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <p className="whitespace-pre-wrap font-serif text-gray-200">{gameState.story}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {isLoading && gameState.story.length > 0 && <div className="flex justify-center mt-4"><LoadingSpinner /></div>}
                        <div ref={storyEndRef} />
                    </div>
                     <div className="flex-shrink-0 p-3 bg-stone-900/80 rounded-b-lg border-t-0 border border-amber-400/30">
                        {gameState.gameOver ? (
                            <div className="text-center p-4">
                                <h3 className="text-xl font-bold text-red-500 font-serif">GAME OVER</h3>
                                <button onClick={startGame} className="mt-2 px-4 py-2 bg-amber-600 rounded-md hover:bg-amber-500 transition-colors">
                                    Begin a New Legend
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="What do you do?"
                                    className="flex-1 bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-white px-3 py-2 rounded-md font-serif"
                                    disabled={isLoading}
                                />
                                <button onClick={handleSend} disabled={isLoading} className="p-2.5 bg-amber-600 rounded-md hover:bg-amber-500 transition-colors disabled:bg-gray-600">
                                    <SendIcon />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default MythosEngine;
