import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { findBugsInProject, generateProjectModifications } from '../services/geminiService';
import { LoadingSpinner, CodeWizardIcon, SearchIcon, MagicWandIcon, SendIcon } from './Icons';
import { FileChange } from '../types';

// In a real scenario, this would come from a build-time process or an API.
// For this simulation, we'll embed the file contents directly.
export const initialProjectFiles: Record<string, string> = {
    "App.tsx": `import React, { useState, useEffect, Suspense, lazy } from 'react';
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
            console.warn(\`Attempted to navigate to a non-existent view: \${payload.view}\`);
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
            backgroundImage: \`url(\${BACKGROUNDS[bgIndex]})\`,
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
        <div className="flex-grow container mx-auto px-2 sm:px-4 mt-20 md:mt-24 flex flex-col items-center pb-20 md:pb-12">
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
`,
    "components/CodeWizard.tsx": `// This file is self-referential for the Code Wizard component.
// The content here is a snapshot of the Code Wizard component itself.
// This is intentional for the feature's simulation.
`,
};

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: React.ReactNode;
}

const CodeWizard: React.FC = () => {
    const [projectFiles, setProjectFiles] = useState(initialProjectFiles);
    const [selectedFile, setSelectedFile] = useState<string>('App.tsx');
    const [userRequest, setUserRequest] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastApplied, setLastApplied] = useState('');
    const [proposedChanges, setProposedChanges] = useState<FileChange[] | null>(null);
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [conversation]);

    const addMessage = (role: 'user' | 'model', content: React.ReactNode) => {
        setConversation(prev => [...prev, { id: Date.now().toString(), role, content }]);
    };
    
    const updateLastMessage = (content: React.ReactNode) => {
        setConversation(prev => [...prev.slice(0, -1), { ...prev[prev.length - 1], content }]);
    };
    
    const handleApplyChanges = useCallback((changes: FileChange[]) => {
        if (!changes) return;
        
        const updatedFiles = { ...projectFiles };
        changes.forEach(change => {
            updatedFiles[change.file] = change.content;
        });

        setProjectFiles(updatedFiles);
        setProposedChanges(null);
        setUserRequest('');
        addMessage('model', `Applied ${changes.length} changes! ✨ What's next?`);
        setLastApplied(`Applied ${changes.length} changes!`);
        setTimeout(() => setLastApplied(''), 4000);
    }, [projectFiles]);

    const handleApply = useCallback(() => {
        if (proposedChanges) {
            handleApplyChanges(proposedChanges);
        }
    }, [proposedChanges, handleApplyChanges]);

    const handleDiscard = useCallback(() => {
        setProposedChanges(null);
        addMessage('model', "Got it, I've discarded those changes. What would you like to do instead?");
    }, []);

    const handleRequest = useCallback(async (request: string, systemInstruction?: string) => {
        if (!request.trim() || isLoading) return;
        
        setIsLoading(true);
        setError(null);
        setProposedChanges(null);
        addMessage('user', request);
        addMessage('model', <LoadingSpinner />);

        try {
            const changes = await generateProjectModifications(request, projectFiles, systemInstruction);
            
            if (!changes || changes.length === 0) {
                 updateLastMessage('The AI did not suggest any changes. Try rephrasing your request.');
                 return;
            }
            setProposedChanges(changes);
            updateLastMessage(
                <div>
                    <p>I've drafted some changes for your review. Check the center panel and let me know if you'd like to apply them.</p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <button onClick={handleApply} className="px-4 py-1 bg-green-600 rounded-md shadow-lg hover:bg-green-500 text-sm transition-all">Apply</button>
                        <button onClick={handleDiscard} className="px-4 py-1 bg-red-600 rounded-md shadow-lg hover:bg-red-500 text-sm transition-all">Discard</button>
                    </div>
                </div>
            );
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            console.error('Code generation error:', err);
            setError(errorMessage);
            updateLastMessage(`Oops! I ran into an error: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setUserRequest('');
        }
    }, [isLoading, projectFiles, handleApply, handleDiscard]);
    
    const handleBugHunt = useCallback(async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        addMessage('user', "Can you scan the project for bugs?");
        addMessage('model', <LoadingSpinner />);

        try {
            const result = await findBugsInProject(projectFiles);
            const reportContent = (
                <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{__html: result.text.replace(/```(\\w+)?\\n/g, '<pre class="bg-gray-800 p-2 rounded-md my-2"><code class="language-$1">').replace(/```/g, '</code></pre>')}}></div>
            );
            
            if (!result.text.includes("magically pristine")) {
                 updateLastMessage(
                    <div>
                        {reportContent}
                        <button onClick={() => handleRequest('Please fix the bugs described in this report', `\\n\\nBug Report:\\n${result.text}`)} className="mt-2 w-full px-4 py-2 bg-green-600 rounded-lg shadow-lg hover:bg-green-500 transition-colors text-sm">Attempt Auto-Fix</button>
                    </div>
                );
            } else {
                 updateLastMessage(reportContent);
            }
        } catch (err) {
            console.error('Bug Detector error:', err);
            const errorMessage = 'Oh no! My bug-zapper seems to have short-circuited. Please try again later. ⚡';
            setError(errorMessage);
            updateLastMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, projectFiles, handleRequest]);

     useEffect(() => {
        if (conversation.length === 0) {
            addMessage('model', 
                <div>
                    <p>I am SageX, your Code Wizard. How can I help you evolve this application?</p>
                </div>
            );
        }
    }, [conversation.length]);

    const currentCode = useMemo(() => projectFiles[selectedFile] || '', [selectedFile, projectFiles]);
    
    const filteredFiles = useMemo(() => 
        Object.keys(projectFiles)
            .filter(file => file.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort(), 
        [projectFiles, searchQuery]
    );

    const renderFileExplorer = () => (
        <div className="flex flex-col h-full bg-black/20 rounded-lg border border-white/10">
            <h2 className="text-md font-semibold p-3 border-b border-white/10 text-gray-300">Project Explorer</h2>
            <div className="p-2 border-b border-white/10">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/50 text-white text-sm rounded-md pl-8 pr-2 py-1 border border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-2">
                <ul>
                   {filteredFiles.map(file => (
                       <li key={file}
                           onClick={() => setSelectedFile(file)}
                           className={`p-1.5 rounded cursor-pointer text-sm truncate ${selectedFile === file ? 'bg-purple-600/50 text-white' : 'hover:bg-white/10 text-gray-400'}`}
                       >
                           {file}
                       </li>
                   ))}
                </ul>
            </div>
        </div>
    );
    
    const renderEditorPanel = () => {
        if (proposedChanges) {
             return (
                <motion.div
                    key="review"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col h-full bg-black/20 rounded-lg border border-amber-400/50"
                >
                    <h2 className="text-md font-semibold p-3 border-b border-white/10 text-amber-300">Proposed Changes for Review</h2>
                    <div className="flex-grow overflow-y-auto p-2 space-y-4">
                       {proposedChanges.map(change => (
                           <div key={change.file} className="bg-black/30 rounded-lg border border-white/10">
                               <div className="p-2 border-b border-white/10">
                                   <p className="font-bold text-purple-300">{change.file}</p>
                                   <p className="text-xs text-gray-400 italic">{change.description}</p>
                               </div>
                               <pre className="p-2 text-xs overflow-x-auto max-h-60"><code>{change.content}</code></pre>
                           </div>
                       ))}
                    </div>
                </motion.div>
            )
        }
        return (
            <motion.div
                key="editor"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col h-full bg-black/20 rounded-lg border border-white/10"
            >
                 <h2 className="text-md font-semibold p-3 border-b border-white/10 text-gray-300">Code Viewer: <span className="text-purple-300">{selectedFile}</span></h2>
                 <div className="flex-grow overflow-y-auto">
                    <pre className="h-full text-xs font-mono p-2">
                        <code>{currentCode}</code>
                    </pre>
                </div>
            </motion.div>
        )
    }

    const renderAiPanel = () => (
        <div className="flex flex-col h-full bg-black/20 rounded-lg border border-white/10">
             <h2 className="text-md font-semibold p-3 border-b border-white/10 text-gray-300">AI Chat</h2>
             <div ref={chatContainerRef} className="flex-grow p-3 overflow-y-auto space-y-4">
                 {conversation.map((msg) => (
                    <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                         {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-purple-500 flex-shrink-0 mt-1" />}
                         <div className={`max-w-xs md:max-w-sm p-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800/80'}`}>
                            {msg.content}
                         </div>
                    </div>
                 ))}
             </div>
             <div className="flex-shrink-0 p-3 border-t border-white/10">
                {conversation.length <= 1 && !isLoading && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <button onClick={handleBugHunt} className="w-full flex items-center justify-center gap-1.5 p-2 bg-amber-600/50 hover:bg-amber-600/80 text-xs rounded-lg transition-all disabled:opacity-50"><SearchIcon className="h-4 w-4 text-white" /> Scan for Bugs</button>
                        <button onClick={() => handleRequest("Analyze the project and suggest a new creative and useful feature. Then, implement that feature.")} className="w-full flex items-center justify-center gap-1.5 p-2 bg-sky-600/50 hover:bg-sky-600/80 text-xs rounded-lg transition-all disabled:opacity-50"><MagicWandIcon className="h-4 w-4 text-white"/> Suggest Feature</button>
                    </div>
                )}
                <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1">
                    <input
                        type="text"
                        value={userRequest}
                        onChange={(e) => setUserRequest(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRequest(userRequest)}
                        placeholder="Tell me what to build..."
                        className="flex-1 bg-transparent focus:outline-none text-white px-2 text-sm"
                        disabled={isLoading}
                    />
                    <button onClick={() => handleRequest(userRequest)} disabled={isLoading || !userRequest} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <SendIcon />
                    </button>
                </div>
             </div>
        </div>
    );

    return (
        <motion.div
            className="w-full md:min-h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-2 md:p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 flex items-center gap-4 mb-4">
                 <div className="p-2 bg-purple-500/20 rounded-full">
                    <CodeWizardIcon className="h-8 w-8 text-purple-300" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">AI Code Wizard</h1>
                    <p className="text-xs md:text-sm text-gray-300">The application's source code is your canvas. Let's build together.</p>
                </div>
                <AnimatePresence>
                   {lastApplied && <motion.div initial={{opacity: 0, y: 10}} animate={{opacity:1, y: 0}} exit={{opacity: 0, y: 10}} className="ml-auto bg-green-500/80 text-white text-xs font-bold px-3 py-1 rounded-full z-10">{lastApplied}</motion.div>}
                </AnimatePresence>
            </div>
            
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 relative overflow-y-auto lg:overflow-y-hidden">
                 {isLoading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg">
                        <LoadingSpinner />
                        <p className="mt-2 text-purple-300">SageX is Awakening...</p>
                    </div>
                )}
                <div className="col-span-1 lg:col-span-2 min-h-0 h-full min-h-[250px] lg:min-h-0">{renderFileExplorer()}</div>
                <div className="col-span-1 lg:col-span-6 min-h-0 h-full min-h-[400px] lg:min-h-0"><AnimatePresence mode="wait">{renderEditorPanel()}</AnimatePresence></div>
                <div className="col-span-1 lg:col-span-4 min-h-0 h-full min-h-[400px] lg:min-h-0">{renderAiPanel()}</div>
            </div>

            <div className="flex-shrink-0 pt-2 text-center">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <p className="text-xs text-gray-500">Changes are applied to the in-memory filesystem and will be reset on page refresh.</p>
            </div>
        </motion.div>
    );
};

export default CodeWizard;
