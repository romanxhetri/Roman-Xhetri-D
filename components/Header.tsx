import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_ITEMS, View } from '../constants';
import { DraggableItem } from './DraggableItem';
import { UpdateIcon, LanguageIcon, LogoIcon, MenuIcon, CloseIcon } from './Icons';
import { CommandBar } from './CommandBar';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const LanguageSelector: React.FC = () => (
    <div className="absolute top-12 right-0 mt-2 w-48 bg-black/50 backdrop-blur-lg rounded-md shadow-lg ring-1 ring-white/10">
        <div className="py-1">
            <a href="#" className="block px-4 py-2 text-sm text-gray-200 hover:bg-purple-500/30">English</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-200 hover:bg-purple-500/30">Español</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-200 hover:bg-purple-500/30">Français</a>
            <a href="#" className="block px-4 py-2 text-sm text-gray-200 hover:bg-purple-500/30">नेपाली</a>
        </div>
    </div>
);


export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const [isLangOpen, setLangOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleNavClick = (view: View) => {
    setActiveView(view);
    setMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4" style={{ perspective: '1000px' }}>
      <div className="container mx-auto flex justify-between items-center bg-black/30 backdrop-blur-md rounded-2xl p-2 border border-white/10 shadow-lg relative">
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setActiveView(View.HOME)}
        >
            <LogoIcon />
            <h1 className="text-xl md:text-2xl font-bold tracking-wider text-shadow-glow">SageX</h1>
        </motion.div>

        <div className="hidden md:flex flex-1 justify-center px-8">
            <CommandBar />
        </div>
        
        <div className='flex items-center'>
            <nav className="hidden lg:flex items-center gap-1" style={{ transformStyle: 'preserve-3d' }}>
                {NAV_ITEMS.map((item) => (
                    <DraggableItem key={item.view}>
                        <motion.button
                            onClick={() => handleNavClick(item.view as View)}
                            className={`px-3 py-2 rounded-lg text-xs transition-all duration-300 transform-gpu ${activeView === item.view ? 'bg-purple-600/50 text-white shadow-lg' : 'text-gray-300 bg-black/20 hover:bg-white/10 hover:text-white'}`}
                            style={{
                                textShadow: activeView === item.view ? "0 0 8px rgba(255, 255, 255, 0.8)" : "none",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                            }}
                            whileHover={{ 
                                scale: 1.1, 
                                y: -2,
                                transform: 'translateZ(20px)',
                                boxShadow: "0 10px 25px rgba(168, 85, 247, 0.5)",
                                textShadow: "0 0 10px #fff" 
                            }}
                            whileTap={{ scale: 0.95, transform: 'translateZ(10px)' }}
                        >
                            {item.label}
                        </motion.button>
                    </DraggableItem>
                ))}
            </nav>

            <div className="flex items-center gap-2 md:gap-4 pl-2 md:pl-4">
                <div className="relative">
                    <motion.button 
                        onClick={() => setLangOpen(!isLangOpen)}
                        whileHover={{ scale: 1.1 }} 
                        whileTap={{ scale: 0.95 }} 
                        className="p-2 rounded-full bg-white/10 hover:bg-purple-500/30 transition-colors"
                    >
                        <LanguageIcon />
                    </motion.button>
                    <AnimatePresence>
                        {isLangOpen && <LanguageSelector />}
                    </AnimatePresence>
                </div>
                <motion.button 
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-shadow"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <UpdateIcon />
                    <span className="text-sm">Update AI</span>
                </motion.button>
                <div className="lg:hidden">
                    <motion.button 
                        onClick={() => setMenuOpen(!isMenuOpen)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-full bg-white/10 hover:bg-purple-500/30 transition-colors"
                    >
                        {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
                    </motion.button>
                </div>
            </div>
        </div>
        <AnimatePresence>
            {isMenuOpen && (
                 <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-black/50 backdrop-blur-lg rounded-lg shadow-lg border border-white/10 lg:hidden"
                 >
                    <nav className="flex flex-col p-2">
                         {NAV_ITEMS.map((item) => (
                             <button
                                key={item.view}
                                onClick={() => handleNavClick(item.view as View)}
                                className={`px-4 py-3 text-left rounded-md transition-colors ${activeView === item.view ? 'bg-purple-600/50 text-white' : 'hover:bg-white/10 text-gray-300'}`}
                            >
                                {item.label}
                            </button>
                         ))}
                    </nav>
                 </motion.div>
            )}
        </AnimatePresence>
      </div>
    </header>
  );
};