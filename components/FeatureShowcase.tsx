import React from 'react';
import { motion } from 'framer-motion';
import { DevToolIcon } from './Icons';

interface FeatureShowcaseProps {
  title: string;
  description: string;
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ title, description }) => {
  return (
    <motion.div
      className="w-full h-full md:max-w-4xl md:h-[75vh] flex flex-col items-center justify-center text-center bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-4 md:p-8"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5, ease: 'backOut' }}
    >
        <div className="p-4 bg-purple-500/20 rounded-full mb-6">
            <DevToolIcon />
        </div>
      <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">{title}</h1>
      <p className="text-base md:text-lg text-gray-300 mb-8 max-w-2xl">{description}</p>
      <div className="w-full h-48 bg-white/5 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">[ Interactive UI Mockup for {title} ]</p>
      </div>
      <p className="text-sm text-purple-400 mt-6 animate-pulse">This feature is currently under cosmic construction!</p>
    </motion.div>
  );
};

export default FeatureShowcase;