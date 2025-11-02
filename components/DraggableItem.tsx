import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface DraggableItemProps {
  children: ReactNode;
}

export const DraggableItem: React.FC<DraggableItemProps> = ({ children }) => {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -50, right: 50, top: -20, bottom: 20 }}
      dragElastic={0.2}
      dragTransition={{ bounceStiffness: 200, bounceDamping: 10 }}
      className="cursor-grab"
      whileDrag={{ cursor: 'grabbing' }}
    >
      {children}
    </motion.div>
  );
};
