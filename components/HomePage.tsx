import React from 'react';
import { motion } from 'framer-motion';
import { View } from '../constants';
import SolarSystem from './SolarSystem';

interface HomePageProps {
    setActiveView: (view: View) => void;
}

const HomePage: React.FC<HomePageProps> = ({ setActiveView }) => {
    return (
        <motion.div
            className="w-full h-full absolute top-0 left-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
        >
            <SolarSystem setActiveView={setActiveView} />
        </motion.div>
    );
};

export default HomePage;