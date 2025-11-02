import React from 'react';
import { motion } from 'framer-motion';

export const Assistant: React.FC = () => {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: window.innerWidth-200, top: 0, bottom: window.innerHeight-200 }}
      dragElastic={0.1}
      initial={{ opacity: 0, y: 100, scale: 0.5 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.5, type: 'spring' }}
      className="fixed bottom-4 right-4 z-50 cursor-grab w-40 h-40 md:w-48 md:h-48"
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
  );
};
