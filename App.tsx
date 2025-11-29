import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Header } from './components/Header';
import { View, NAV_ITEMS } from './constants';
import { LoadingSpinner } from './components/Icons';

const HomePage = lazy(() => import('./components/HomePage'));
const ChatInterface = lazy(() => import('./components/ChatInterface'));
const AISearch = lazy(() => import('./components/AISearch'));
const FeatureShowcase = lazy(() => import('./components/FeatureShowcase'));
const LiveConversation = lazy(() => import('./components/LiveConversation'));
const TextToSpeech = lazy(() => import('./components/TextToSpeech'));
const MediaCreationHub = lazy(() => import('./components/MediaCreationHub'));
const CodeWizard = lazy(() => import('./components/CodeWizard'));
const AetherCanvas = lazy(() => import('./components/AetherCanvas'));
const DataOracle = lazy(() => import('./components/DataOracle'));
const TripPlanner = lazy(() => import('./components/TripPlanner'));
const StoryWeaver = lazy(() => import('./components/StoryWeaver'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const LaptopsPage = lazy(() => import('./components/LaptopsPage'));
const MobilesPage = lazy(() => import('./components/MobilesPage'));
const DeviceTroubleshooter = lazy(() => import('./components/DeviceTroubleshooter'));
const DreamWeaver = lazy(() => import('./components/DreamWeaver'));
const CosmicComposer = lazy(() => import('./components/CosmicComposer'));
const MythosEngine = lazy(() => import('./components/MythosEngine'));
const TemporalInvestigator = lazy(() => import('./components/TemporalInvestigator'));
const BioSymphony = lazy(() => import('./components/BioSymphony'));
const EchoForge = lazy(() => import('./components/EchoForge'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));


const BACKGROUNDS = [
  'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=1920&auto=format&fit=crop', // mystical night
  'https://images.unsplash.com/photo-1506863530036-1c237d9f5136?q=80&w=1920&auto=format&fit=crop', // fire festival
  'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=1920&auto=format&fit=crop', // rain/thunder
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.HOME);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const handleCommand = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { command, payload } = customEvent.detail;
      if (command === 'navigate' && payload.view) {
        const viewExists = Object.values(View).includes(payload.view);
        if (viewExists) {
            setActiveView(payload.view);
        } else {
            console.warn(`Attempted to navigate to a non-existent view: ${payload.view}`);
        }
      }
    };

    window.addEventListener('sagex-command', handleCommand);
    return () => {
      window.removeEventListener('sagex-command', handleCommand);
    };
  }, []);


  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % BACKGROUNDS.length);
    }, 10000); 
    return () => clearInterval(interval);
  }, []);

  const renderActiveView = () => {
    const item = NAV_ITEMS.find(navItem => navItem.view === activeView);
    const title = item ? item.label : 'SageX';
    const description = item ? item.description : 'Welcome to the AI Universe';

    switch (activeView) {
      case View.HOME:
        return <HomePage key={View.HOME} setActiveView={setActiveView} />;
      case View.CHATGPT:
        return <ChatInterface key={View.CHATGPT} />;
      case View.AI_SEARCH:
        return <AISearch key={View.AI_SEARCH}/>;
      case View.MEDIA_CREATION:
        return <MediaCreationHub key={View.MEDIA_CREATION} />;
      case View.LIVE_CONVERSATION:
        return <LiveConversation key={View.LIVE_CONVERSATION} />;
      case View.TTS:
        return <TextToSpeech key={View.TTS} />;
      case View.CODE_WIZARD:
        return <CodeWizard key={View.CODE_WIZARD} />;
       case View.AETHER_CANVAS:
        return <AetherCanvas key={View.AETHER_CANVAS} />;
       case View.DATA_ORACLE:
        return <DataOracle key={View.DATA_ORACLE} />;
      case View.TRIP_PLANNER:
        return <TripPlanner key={View.TRIP_PLANNER} />;
      case View.STORY_WEAVER:
        return <StoryWeaver key={View.STORY_WEAVER} />;
      case View.DREAM_WEAVER:
        return <DreamWeaver key={View.DREAM_WEAVER} />;
      case View.COSMIC_COMPOSER:
        return <CosmicComposer key={View.COSMIC_COMPOSER} />;
      case View.MYTHOS_ENGINE:
        return <MythosEngine key={View.MYTHOS_ENGINE} />;
      case View.TEMPORAL_INVESTIGATOR:
        return <TemporalInvestigator key={View.TEMPORAL_INVESTIGATOR} />;
      case View.BIO_SYMPHONY:
        return <BioSymphony key={View.BIO_SYMPHONY} />;
      case View.ECHO_FORGE:
        return <EchoForge key={View.ECHO_FORGE} />;
      case View.PRODUCT:
        return <ProductPage key={View.PRODUCT} />;
      case View.LAPTOPS:
        return <LaptopsPage key={View.LAPTOPS} />;
      case View.MOBILES:
        return <MobilesPage key={View.MOBILES} />;
      case View.DEVICE_TROUBLESHOOTER:
        return <DeviceTroubleshooter key={View.DEVICE_TROUBLESHOOTER} />;
      case View.ADMIN:
        return <AdminPanel key={View.ADMIN} />;
      default:
        return <FeatureShowcase key={activeView} title={title} description={description} />;
    }
  };

  return (
    <main className="min-h-screen w-screen overflow-x-hidden text-white font-sans font-orbitron bg-black relative">
      <AnimatePresence>
        <motion.div
          key={bgIndex}
          className="fixed inset-0 w-full h-full bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${BACKGROUNDS[bgIndex]})`,
            willChange: 'opacity, transform',
          }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </AnimatePresence>
      <div className="fixed inset-0 bg-black/50" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header activeView={activeView} setActiveView={setActiveView} />
        <div className="flex-grow container mx-auto px-2 sm:px-4 mt-20 md:mt-24 flex flex-col items-center pb-8">
           <Suspense fallback={<div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}>
             <AnimatePresence mode="wait">
              {renderActiveView()}
            </AnimatePresence>
          </Suspense>
        </div>
      </div>
    </main>
  );
};

export default App;