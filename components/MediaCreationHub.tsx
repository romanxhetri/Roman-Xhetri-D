import React, { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { VideoConjurerIcon, MagicWandIcon, EditIcon, LoadingSpinner, TshirtIcon } from './Icons';

const VideoConjurer = lazy(() => import('./VideoConjurer'));
const ImageWizard = lazy(() => import('./ImageWizard'));
const ImageEditor = lazy(() => import('./ImageEditor'));
const ClothingDesigner = lazy(() => import('./ClothingDesigner'));

type MediaTab = 'generate' | 'edit' | 'video' | 'design';

const TABS: { id: MediaTab; label: string; icon: React.ReactNode }[] = [
    { id: 'generate', label: 'Image Wizard', icon: <MagicWandIcon className="w-5 h-5" /> },
    { id: 'edit', label: 'Image Editor', icon: <EditIcon className="w-5 h-5" /> },
    { id: 'video', label: 'Video Conjurer', icon: <VideoConjurerIcon className="w-5 h-5" /> },
    { id: 'design', label: 'Clothing Designer', icon: <TshirtIcon className="w-5 h-5" /> },
];

const MediaCreationHub: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MediaTab>('generate');

    const renderContent = () => {
        switch (activeTab) {
            case 'video': return <VideoConjurer />;
            case 'generate': return <ImageWizard />;
            case 'edit': return <ImageEditor />;
            case 'design': return <ClothingDesigner />;
            default: return null;
        }
    };

    return (
        <motion.div 
            className="w-full md:max-w-6xl md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-2 sm:p-6"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex justify-center items-center mb-4 sm:mb-6 border-b border-white/20 pb-4">
                <div className="flex flex-wrap justify-center">
                {TABS.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-3 sm:px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
                            activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-purple-500"
                                layoutId="underline"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
                </div>
            </div>

            <div className="flex-grow relative">
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><LoadingSpinner /></div>}>
                    {renderContent()}
                </Suspense>
            </div>
        </motion.div>
    );
};

export default MediaCreationHub;