import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTroubleshootingResponse } from '../services/geminiService';
import { Message } from '../types';
import { SendIcon, LoadingSpinner, TroubleshooterIcon } from './Icons';

const DeviceTroubleshooter: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
      { id: '1', role: 'model', text: 'Hello! I am Chip, your AI troubleshooting assistant. 🔧\n\nPlease describe the problem you are having with your device in as much detail as possible.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, newUserMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const historyForApi = messages.map(({ role, text }) => ({ role, text })) as Message[];
      const response = await getTroubleshootingResponse(historyForApi, currentInput);

      const modelMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text,
      };
      setMessages(prev => [...prev, modelMessage]);

    } catch (error) {
      console.error('Error fetching troubleshooting response:', error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: 'Oops! My diagnostic tools are offline. 🛠️ Please try again later.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderResponse = (text: string) => {
    const html = text
        .replace(/\n/g, '<br />')
        .replace(/(\d+\.)/g, '<br /><strong>$1</strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <motion.div 
        className="w-full md:max-w-4xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div className="flex-shrink-0 text-center p-4 border-b border-white/10">
          <div className="inline-block p-3 bg-sky-500/20 rounded-full mb-2">
              <TroubleshooterIcon className="h-8 w-8 text-sky-300" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-cyan-400">Device Troubleshooter</h1>
          <p className="text-sm text-gray-300">Your personal AI tech support.</p>
      </div>

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
              {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-sky-500 flex-shrink-0 mt-2" />}
              <div className={`max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800/80'}`}>
                  <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 text-white whitespace-pre-wrap">
                      {renderResponse(msg.text)}
                  </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start gap-3 my-4">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex-shrink-0" />
            <div className="max-w-md p-3 rounded-2xl bg-gray-800/80 flex items-center">
              <LoadingSpinner />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 sm:p-4 border-t border-white/10">
        <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="e.g., 'My phone screen is flickering...'"
            className="flex-1 bg-transparent focus:outline-none text-white px-2 resize-none"
            disabled={isLoading}
            rows={1}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600">
            <SendIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DeviceTroubleshooter;