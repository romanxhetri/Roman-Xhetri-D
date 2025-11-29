import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Hint {
    text: string;
    view: string;
}

export const Assistant: React.FC = () => {
  const [hint, setHint] = useState<Hint | null>(null);

  useEffect(() => {
    const handleShowHint = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { text, view } = customEvent.detail;
        
        setHint({ text, view });
    };

    window.addEventListener('sagex-show-hint', handleShowHint);
    return () => {
        window.removeEventListener('sagex-show-hint', handleShowHint);
    };
  }, []);

  useEffect(() => {
      if (hint) {
          const timer = setTimeout(() => {
              setHint(null);
          }, 5000); // Hint disappears after 5 seconds
          return () => clearTimeout(timer);
      }
  }, [hint]);

  const handleHintClick = () => {
      if (!hint) return;
      
      const commandEvent = new CustomEvent('sagex-command', {
          detail: { command: 'navigate', payload: { view: hint.view } }
      });
      window.dispatchEvent(commandEvent);
      
      setHint(null); // Hide hint immediately after click
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] pointer-events-none">
       <AnimatePresence>
        {hint && (
             <motion.button
                onClick={handleHintClick}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(168, 85, 247, 0.7)" }}
                className="absolute bottom-full right-10 mb-4 w-64 md:w-72 bg-black/70 backdrop-blur-lg border border-purple-500/50 rounded-xl shadow-2xl p-3 text-left pointer-events-auto cursor-pointer"
             >
                <p className="text-sm text-white italic">"{hint.text}"</p>
                <div 
                    className="absolute left-1/2 -bottom-2.5 transform -translate-x-1/2 w-5 h-5 bg-black/70 border-b border-r border-purple-500/50"
                    style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}
                />
            </motion.button>
        )}
       </AnimatePresence>

        <motion.div
          drag
          dragConstraints={{ left: -window.innerWidth + 200, right: 0, top: -window.innerHeight + 200, bottom: 0 }}
          dragElastic={0.1}
          initial={{ opacity: 0, y: 100, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, type: 'spring' }}
          className="relative z-50 cursor-grab w-40 h-40 md:w-48 md:h-48 pointer-events-auto"
          whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
          whileHover={{ scale: 1.1 }}
        >
            <img 
                src={`https://i.pinimg.com/originals/a6/58/32/a6583271445657431e83921312c4d872.png`} 
                alt="SageX Assistant" 
                className="w-full h-full object-contain pointer-events-none"
                style={{ filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.7))' }}
            />
        </motion.div>
    </div>
  );
};
