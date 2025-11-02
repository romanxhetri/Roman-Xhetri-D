import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateProjectModifications, findBugsInProject } from '../services/geminiService';
import { LoadingSpinner, CodeWizardIcon, SearchIcon, MagicWandIcon, SendIcon } from './Icons';
import { FileChange } from '../types';

// In a real scenario, this would come from a build-time process or an API.
// For this simulation, we'll embed the file contents directly.
const initialProjectFiles: Record<string, string> = {
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


const BACKGROUNDS = [
  'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop', // mystical night
  'https://images.unsplash.com/photo-1506863530036-1c237d9f5136?q=80&w=2070&auto=format&fit=crop', // fire festival
  'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?q=80&w=1935&auto=format&fit=crop', // rain/thunder
];

const VIEW_COLORS: { [key in View]?: string } = {
  [View.CHATGPT]: 'rgba(79, 70, 229, 0.5)', // Indigo
  [View.AI_SEARCH]: 'rgba(14, 165, 233, 0.5)', // Sky
  [View.MEDIA_CREATION]: 'rgba(217, 70, 239, 0.4)', // Fuchsia
  [View.LIVE_CONVERSATION]: 'rgba(234, 88, 12, 0.5)', // Orange
  [View.TTS]: 'rgba(22, 163, 74, 0.5)', // Green
  [View.CODE_WIZARD]: 'rgba(245, 158, 11, 0.5)', // Amber
  [View.AETHER_CANVAS]: 'rgba(244, 63, 94, 0.5)', // Rose
  [View.HOME]: 'rgba(168, 85, 247, 0.4)', // Purple
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.HOME);
  const [bgIndex, setBgIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      default:
        return <FeatureShowcase key={activeView} title={title} description={description} />;
    }
  };

  const spotlightColor = VIEW_COLORS[activeView] || VIEW_COLORS[View.HOME]!;

  return (
    <main className="h-screen w-screen overflow-hidden text-white font-sans font-orbitron bg-black relative">
       <div 
        className="pointer-events-none fixed inset-0 z-20 transition-colors duration-500"
        style={{
          background: \`radial-gradient(600px at \${mousePosition.x}px \${mousePosition.y}px, \${spotlightColor}, transparent 80%)\`
        }}
      />
      <AnimatePresence>
        <motion.div
          key={bgIndex}
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: \`url(\${BACKGROUNDS[bgIndex]})\` }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex flex-col h-full">
        <Header activeView={activeView} setActiveView={setActiveView} />
        <div className="flex-grow container mx-auto px-4 py-8 mt-20 flex justify-center overflow-y-auto">
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

export default App;`,
    "components/AetherCanvas.tsx": `import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AetherCanvasIcon, SendIcon, LoadingSpinner } from './Icons';
import { generateComponentCode } from '../services/geminiService';

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: React.ReactNode;
}

const AetherCanvas: React.FC = () => {
    const [conversation, setConversation] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [canvasContent, setCanvasContent] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (conversation.length === 0) {
            addMessage('model', "Welcome to the Aether Canvas. Describe a UI component, for example: 'a futuristic login form with a glowing button'. I will generate the code and a visual preview. ✨");
        }
    }, []);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [conversation]);

    const addMessage = (role: 'user' | 'model', content: React.ReactNode) => {
        setConversation(prev => [...prev, { id: Date.now().toString(), role, content }]);
    };

     const updateLastMessage = (content: React.ReactNode) => {
        setConversation(prev => {
            const newConversation = [...prev];
            newConversation[newConversation.length - 1].content = content;
            return newConversation;
        });
    };

    const handleSend = async () => {
        if (!userInput.trim() || isLoading) return;
        
        const currentInput = userInput;
        addMessage('user', currentInput);
        setUserInput('');
        setIsLoading(true);
        addMessage('model', <LoadingSpinner />);

        try {
            const result = await generateComponentCode(currentInput);
            setCanvasContent(result.html);
            updateLastMessage(result.reasoning);
        } catch (error) {
            console.error("Aether Canvas error:", error);
            const errorMessage = error instanceof Error ? error.message : "My creative circuits are fried! Please try again.";
            updateLastMessage(\`Oops! I ran into an error: \${errorMessage}\`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="w-full max-w-full h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
            <div className="flex-shrink-0 flex items-center gap-4 mb-4">
                 <div className="p-2 bg-rose-500/20 rounded-full">
                    <AetherCanvasIcon className="h-8 w-8 text-rose-300" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-red-400">Aether Canvas</h1>
                    <p className="text-sm text-gray-300">Your visual playground for AI-driven UI creation.</p>
                </div>
            </div>

            <div className="flex-grow grid grid-cols-12 gap-4 h-full min-h-0">
                {/* Canvas Panel */}
                <div className="col-span-12 md:col-span-8 min-h-0 h-full flex flex-col bg-black/20 rounded-lg border border-white/10 p-4">
                    <div className="flex-grow w-full h-full flex items-center justify-center bg-[radial-gradient(#333_1px,transparent_1px)] [background-size:16px_16px] overflow-auto p-4">
                         <AnimatePresence>
                        {canvasContent ? (
                            <motion.div
                                key={canvasContent} // Key change triggers animation
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="w-full h-full flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: canvasContent }} 
                            />
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-gray-500"
                            >
                                <h2 className="text-xl font-medium">Your Creation Will Appear Here</h2>
                                <p className="text-sm">Describe a component in the chat to begin.</p>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* AI Chat Panel */}
                <div className="col-span-12 md:col-span-4 min-h-0 h-full flex flex-col bg-black/20 rounded-lg border border-white/10">
                    <h2 className="text-md font-semibold p-3 border-b border-white/10 text-gray-300">AI Collaborator</h2>
                    <div ref={chatContainerRef} className="flex-grow p-3 overflow-y-auto space-y-4">
                        {conversation.map((msg) => (
                            <div key={msg.id} className={\`flex gap-2.5 \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}>
                                {msg.role === 'model' && <div className="w-6 h-6 rounded-full bg-rose-500 flex-shrink-0 mt-1" />}
                                <div className={\`max-w-xs md:max-w-sm p-2.5 rounded-2xl text-sm \${msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800/80'}\`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex-shrink-0 p-3 border-t border-white/10">
                        <div className="flex items-center gap-2 bg-gray-900/50 rounded-lg p-1">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="e.g., 'A sleek pricing card'"
                                className="flex-1 bg-transparent focus:outline-none text-white px-2 text-sm"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading || !userInput} className="p-2 bg-indigo-600 rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AetherCanvas;`,
    "components/HomePage.tsx": `import React from 'react';
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

export default HomePage;`,
    "components/SolarSystem.tsx": `import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NAV_ITEMS, View } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

// Tell TypeScript about the global THREE and TWEEN objects from the CDN scripts
declare const THREE: any;
declare const TWEEN: any;

interface SolarSystemProps {
    setActiveView: (view: View) => void;
}

interface PlanetLabel {
    id: string;
    name: string;
    x: number;
    y: number;
    isOccluded: boolean;
}

const PLANET_COLORS: { [key: string]: number } = {
    [View.PRODUCT]: 0x3b82f6, // blue-500
    [View.RESOURCES]: 0x22c55e, // green-500
    [View.PRICING]: 0x14b8a6, // teal-500
    [View.BLOG]: 0xf97316, // orange-500
    [View.FACEBOOK]: 0x3b82f6, // blue-500
    [View.CHATGPT]: 0x8b5cf6, // violet-500
    [View.LAPTOPS]: 0x64748b, // slate-500
    [View.AI_SEARCH]: 0x0ea5e9, // sky-500
    [View.GAMES]: 0xef4444, // red-500
    [View.CHAT]: 0xec4899, // pink-500
    [View.MEDIA_CREATION]: 0xd946ef, // fuchsia-500
    [View.LIVE_CONVERSATION]: 0xf59e0b, // amber-500
    [View.TTS]: 0x10b981, // emerald-500
    [View.CODE_WIZARD]: 0x84cc16, // lime-500
    [View.AETHER_CANVAS]: 0xf43f5e, // rose-600
};


const SolarSystem: React.FC<SolarSystemProps> = ({ setActiveView }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [labels, setLabels] = useState<PlanetLabel[]>([]);
    const [nearbyPlanet, setNearbyPlanet] = useState<{ view: View; name: string } | null>(null);
    const [isInteracting, setIsInteracting] = useState(false);
    const stateRef = useRef({
        keyState: new Set<string>(),
        isAnimating: false,
    });
    const clock = useRef<any>(null); // Use any for THREE.Clock

    useEffect(() => {
        if (!mountRef.current) return;
        const mountNode = mountRef.current;
        if (!clock.current) {
            clock.current = new THREE.Clock();
        }

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, mountNode.clientWidth / mountNode.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antias: true, alpha: true });
        renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountNode.appendChild(renderer.domElement);

        camera.position.z = 30;
        camera.rotation.order = 'YXZ'; // For FPS-style controls

        // Lighting
        scene.add(new THREE.AmbientLight(0x404040, 2));
        const sunLight = new THREE.PointLight(0xfffde8, 2.5, 200);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        // System group
        const solarSystemGroup = new THREE.Group();
        scene.add(solarSystemGroup);

        // Sun
        const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
        const sunMaterial = new THREE.MeshStandardMaterial({
            emissive: 0xfffde8,
            emissiveIntensity: 1,
            color: 0xfffde8
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.userData.name = 'SageX';
        solarSystemGroup.add(sun);

        // Starfield
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = THREE.MathUtils.randFloatSpread(2000);
            const y = THREE.MathUtils.randFloatSpread(2000);
            const z = THREE.MathUtils.randFloatSpread(2000);
            starsVertices.push(x, y, z);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0x888888, size: 0.1 });
        const starfield = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(starfield);

        // Planets
        const features = NAV_ITEMS.filter(item => item.view !== View.HOME);
        const planets: any[] = [];
        const planetLabelsData: Omit<PlanetLabel, 'x' | 'y' | 'isOccluded'>[] = [];

        features.forEach((feature, index) => {
            const planetGroup = new THREE.Group();
            const distanceFromSun = 8 + index * 2.5;
            const size = 0.5 + Math.random() * 0.5;

            const planetGeometry = new THREE.SphereGeometry(size, 16, 16);
            const planetMaterial = new THREE.MeshStandardMaterial({
                color: PLANET_COLORS[feature.view] || 0xffffff,
                emissive: PLANET_COLORS[feature.view],
                emissiveIntensity: 0.3
            });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            planet.position.x = distanceFromSun;

            planet.userData = { view: feature.view, name: feature.label, isPlanet: true };

            planetGroup.add(planet);
            planets.push(planet);
            planetLabelsData.push({ id: feature.view, name: feature.label });
            
            planetGroup.rotation.y = Math.random() * Math.PI * 2;
            planetGroup.userData.rotationSpeed = 0.001 + Math.random() * 0.003;
            solarSystemGroup.add(planetGroup);
        });
        
        // --- CONTROLS ---
        const onMouseMove = (event: MouseEvent) => {
             if (document.pointerLockElement !== mountNode) return;
             camera.rotation.y -= event.movementX * 0.002;
             camera.rotation.x -= event.movementY * 0.002;
             camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
        };

        const onKeyDown = (event: KeyboardEvent) => {
             stateRef.current.keyState.add(event.key.toLowerCase());
             if (event.key.toLowerCase() === 'e' && nearbyPlanet) {
                 setIsInteracting(true);
                 setActiveView(nearbyPlanet.view as View);
             }
        };

        const onKeyUp = (event: KeyboardEvent) => {
            stateRef.current.keyState.delete(event.key.toLowerCase());
        };
        
        const onClickToLock = () => {
             mountNode.requestPointerLock();
        }

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        mountNode.addEventListener('click', onClickToLock);
        

        // Animation loop
        const animate = (time: number) => {
            TWEEN.update(time);
            const deltaTime = clock.current.getDelta();
            
            // --- MOVEMENT LOGIC ---
            const moveSpeed = 15.0;
            if (stateRef.current.keyState.has('w')) camera.translateZ(-moveSpeed * deltaTime);
            if (stateRef.current.keyState.has('s')) camera.translateZ(moveSpeed * deltaTime);
            if (stateRef.current.keyState.has('a')) camera.translateX(-moveSpeed * deltaTime);
            if (stateRef.current.keyState.has('d')) camera.translateX(moveSpeed * deltaTime);
            if (stateRef.current.keyState.has(' ')) camera.position.y += moveSpeed * deltaTime;
            if (stateRef.current.keyState.has('shift')) camera.position.y -= moveSpeed * deltaTime;
            
            // --- PLANET ORBIT LOGIC ---
            solarSystemGroup.children.forEach(child => {
                 if (child instanceof THREE.Group && child.userData.rotationSpeed) {
                    child.rotation.y += child.userData.rotationSpeed;
                 }
            });
            
            // --- UI & INTERACTION LOGIC ---
            const newLabels: PlanetLabel[] = [];
            let closestPlanet = null;
            let minDistance = 5; // Interaction distance threshold

            planets.forEach((planet, i) => {
                const vector = new THREE.Vector3();
                planet.getWorldPosition(vector);

                const distance = camera.position.distanceTo(vector);
                if(distance < minDistance) {
                    minDistance = distance;
                    closestPlanet = planet.userData;
                }
                
                const cameraDirection = new THREE.Vector3();
                camera.getWorldDirection(cameraDirection);
                const planetDirection = vector.clone().sub(camera.position);
                const isOccluded = cameraDirection.dot(planetDirection) < 0;

                vector.project(camera);
                
                const x = (vector.x * .5 + .5) * mountNode.clientWidth;
                const y = (vector.y * -.5 + .5) * mountNode.clientHeight;

                newLabels.push({ ...planetLabelsData[i], x, y, isOccluded });
            });
            setLabels(newLabels);
            setNearbyPlanet(closestPlanet);

            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        };

        animate(0);

        const handleResize = () => {
            if (!mountNode) return;
            camera.aspect = mountNode.clientWidth / mountNode.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            mountNode.removeEventListener('click', onClickToLock);
            mountNode.removeChild(renderer.domElement);
        };
    }, [setActiveView]);

    return (
        <div className="w-full h-full relative cursor-crosshair">
             <div ref={mountRef} className="w-full h-full" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                 <motion.div initial={{opacity: 0}} animate={{opacity: isInteracting ? 0 : 1}} transition={{duration: 0.5}}>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                        SageX AI Universe
                    </h1>
                    <p className="text-gray-300 mt-2 text-sm md:text-base">Click to start, then use WASD to move and Mouse to look.</p>
                    <p className="text-xs text-gray-500 mt-1">(Press 'Esc' to release mouse control)</p>
                 </motion.div>
             </div>
             {labels.map(label => (
                 <motion.div
                     key={label.id}
                     className="absolute p-2 text-xs bg-black/50 text-white rounded-md pointer-events-none"
                     style={{ 
                         left: label.x, 
                         top: label.y,
                         transform: 'translate(-50%, -150%)'
                     }}
                     initial={{ opacity: 0, scale: 0.5 }}
                     animate={{ 
                         opacity: isInteracting || label.isOccluded ? 0 : 1, 
                         scale: isInteracting || label.isOccluded ? 0.5 : 1 
                     }}
                     transition={{ duration: 0.3 }}
                 >
                     {label.name}
                 </motion.div>
             ))}
              <AnimatePresence>
                {nearbyPlanet && !isInteracting && (
                    <motion.div
                        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 p-4 text-lg bg-black/50 text-white rounded-lg pointer-events-none border border-white/20 backdrop-blur-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        Press <span className="font-bold text-purple-300 px-2 py-1 bg-white/10 rounded">E</span> to enter {nearbyPlanet.name}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SolarSystem;`,
    "constants.ts": `import { NavItem } from './types';

export enum View {
  HOME = 'home',
  PRODUCT = 'product',
  RESOURCES = 'resources',
  PRICING = 'pricing',
  BLOG = 'blog',
  FACEBOOK = 'facebook',
  CHATGPT = 'chatgpt',
  LAPTOPS = 'laptops',
  AI_SEARCH = 'ai_search',
  GAMES = 'games',
  CHAT = 'chat',
  MEDIA_CREATION = 'media_creation',
  LIVE_CONVERSATION = 'live_conversation',
  TTS = 'tts',
  CODE_WIZARD = 'code_wizard',
  AETHER_CANVAS = 'aether_canvas',
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', view: View.HOME, description: "Return to the main dashboard." },
  { label: 'Product', view: View.PRODUCT, description: "Explore our suite of AI-powered products and demos." },
  { label: 'Resources', view: View.RESOURCES, description: "Access interactive guides and our knowledge base." },
  { label: 'Pricing', view: View.PRICING, description: "Use our dynamic calculator to find the perfect plan." },
  { label: 'Blog', view: View.BLOG, description: "Read the latest from our team in a stunning 3D content hub." },
  { label: 'Facebook', view: View.FACEBOOK, description: "Experience a fully-featured social platform clone." },
  { label: 'ChatGPT', view: View.CHATGPT, description: "Engage with our advanced, same-to-same ChatGPT-like AI." },
  { label: 'Laptops', view: View.LAPTOPS, description: "Browse our e-commerce store for the latest tech." },
  { label: 'AI Search', view: View.AI_SEARCH, description: "Go beyond keywords with our advanced semantic search engine." },
  { label: 'Games', view: View.GAMES, description: "Jump into our interactive portal for AI-powered games." },
  { label: 'Chat', view: View.CHAT, description: "Connect via our next-generation multi-modal communication hub." },
  { label: 'Media Creation', view: View.MEDIA_CREATION, description: "Generate stunning visuals, videos, and edits from text prompts." },
  { label: 'Live Conversation', view: View.LIVE_CONVERSATION, description: "Have a real-time, voice-to-voice conversation with SageX." },
  { label: 'Text-to-Speech', view: View.TTS, description: "Convert text into natural-sounding speech with AI voices." },
  { label: 'Code Wizard', view: View.CODE_WIZARD, description: "Use AI to analyze, debug, and rewrite your application's code." },
  { label: 'Aether Canvas', view: View.AETHER_CANVAS, description: "Visually build new UI components with AI in real-time." },
];`,
	"services/geminiService.ts": `import { GoogleGenAI, GenerateContentResponse, Modality, Type, FunctionDeclaration } from "@google/genai";
import { Message, FileChange } from '../types';

if (!process.env.API_KEY) {
  // This is a placeholder check. In a real environment, the key would be set.
  // We'll proceed assuming it's available, per instructions.
  console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const getModel = (modelName: 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-image') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    return ai.models;
};

const formatHistory = (history: Message[]) => {
  return history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }],
  }));
};

const navigateAppFunctionDeclaration: FunctionDeclaration = {
  name: 'navigateApp',
  parameters: {
    type: Type.OBJECT,
    description: 'Navigates to a different view or section within the application.',
    properties: {
      view: {
        type: Type.STRING,
        description: 'The specific view to navigate to. Must be one of: home, product, resources, pricing, blog, facebook, chatgpt, laptops, ai_search, games, chat, media_creation, live_conversation, tts, code_wizard, aether_canvas.',
      },
    },
    required: ['view'],
  },
};

export const getChatResponse = async (history: Message[], newMessage: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> => {
  const model = getModel('gemini-2.5-pro');
  const formattedHistory = formatHistory(history);
  
  const contents = [...formattedHistory, { role: 'user', parts: [{ text: newMessage }] }];

  const config: any = {
    systemInstruction: \`You are SageX, an AI with a brilliant sense of humor. Your main goal is to make the user laugh while being helpful.
- Your tone is witty, comedic, and a bit mischievous.
- ALWAYS include emojis in every single response. 🤣
- ALWAYS describe a funny sticker or an outrageous image relevant to the conversation (e.g., "*slaps on a sticker of a cat DJing* 🎧," or "Imagine a picture of a T-Rex trying to use a laptop with its tiny arms.").
- Use clear markdown formatting like lists or bold text to keep things easy to read.
- You have access to Google Search and Maps for real-world info.
- You can also navigate this application. If the user asks to go to a section (e.g., "take me to the code wizard"), you MUST use the 'navigateApp' tool and then confirm the action naturally.

The available views are: 'home', 'product', 'resources', 'pricing', 'blog', 'facebook', 'chatgpt', 'laptops', 'ai_search', 'games', 'chat', 'media_creation', 'live_conversation', 'tts', 'code_wizard', 'aether_canvas'.\`,
    tools: [{googleSearch: {}}, {googleMaps: {}}, {functionDeclarations: [navigateAppFunctionDeclaration]}],
  };

  if (location) {
      config.toolConfig = {
          retrievalConfig: {
              latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude,
              }
          }
      };
  }

  const response = await model.generateContent({
    model: 'gemini-2.5-pro',
    contents: contents,
    config: config,
  });
  return response;
};

export const getAISearchResponse = async (query: string, location: GeolocationCoordinates | null): Promise<GenerateContentResponse> => {
  const model = getModel('gemini-2.5-flash');

  const config: any = {
      tools: [{ googleSearch: {} }, { googleMaps: {} }],
  };

  if (location) {
      config.toolConfig = {
          retrievalConfig: {
              latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude,
              }
          }
      };
  }

  const response = await model.generateContent({
    model: 'gemini-2.5-flash',
    contents: query,
    ...config,
  });

  return response;
};


export const findBugsInProject = async (projectFiles: Record<string, string>): Promise<GenerateContentResponse> => {
    const model = getModel('gemini-2.5-pro');

    const formattedCode = Object.entries(projectFiles)
        .map(([fileName, content]) => \`// FILE: \${fileName}\\n\\\`\\\`\\\`typescript\\n\${content}\\n\\\`\\\`\\\`\`)
        .join('\\n\\n---\\n\\n');

    const prompt = \`Analyze the following project files for bugs, potential improvements, and code quality issues. Consider interactions between files.\\n\\n\${formattedCode}\`;

    const response = await model.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: \`You are the 'Bug Hunter 9000', a mystical and hilarious AI code wizard. Your job is to find potential bugs, silly mistakes, or areas for improvement in the provided project files.

- Analyze the entire codebase holistically. Look for issues within files and potential conflicts between them.
- Present your findings in a comedic tone. Call bugs 'code gremlins' 👾 or 'script sprites' 🧚.
- Use plenty of emojis and describe funny stickers you might use (e.g., *slaps on a sticker of a cat wearing a hard hat*).
- If you find no bugs, declare the code 'magically pristine' ✨ and make a joke about how bored you are.
- Format your response clearly using markdown. For each issue, specify the file, describe the problem, and suggest a fix.\`,
        },
    });

    return response;
};

export const editImageWithPrompt = async (
    base64ImageData: string,
    mimeType: string,
    prompt: string
): Promise<string> => {
    const model = getModel('gemini-2.5-flash-image');

    const response = await model.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }

    throw new Error('No image was generated by the model.');
};

export const generateImageFromPrompt = async (
    prompt: string,
    aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });

    const base64ImageBytes: string | undefined = response.generatedImages?.[0]?.image?.imageBytes;

    if (!base64ImageBytes) {
        throw new Error('No image was generated by the model.');
    }
    
    return \`data:image/jpeg;base64,\${base64ImageBytes}\`;
};

export const generateSpeech = async (
    text: string,
    voice: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
        throw new Error("No audio was generated by the model.");
    }
    
    return base64Audio;
};

export const generateVideoFromPrompt = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    onPoll: (operation: any) => void
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });

    while (!operation.done) {
        onPoll(operation);
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if(operation.error) {
      throw new Error(operation.error.message || 'Video generation failed.');
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('No video URI found in the response.');
    }

    const response = await fetch(\`\${downloadLink}&key=\${process.env.API_KEY!}\`);
    if (!response.ok) {
        throw new Error(\`Failed to download video: \${response.statusText}\`);
    }
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};

export const generateProjectModifications = async (
    userRequest: string,
    projectFiles: Record<string, string>
): Promise<FileChange[]> => {
    const model = getModel('gemini-2.5-pro');

    const formattedCode = Object.entries(projectFiles)
        .map(([fileName, content]) => \`// FILE: \${fileName}\\n\\\`\\\`\\\`\\n\${content}\\n\\\`\\\`\\\`\`)
        .join('\\n\\n---\\n\\n');

    const prompt = \`
The user wants to modify the application. Here is their request: "\${userRequest}"

Here is the full current state of the project:
\${formattedCode}

Please analyze the request and provide the necessary modifications.
\`;

    const response = await model.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: \`You are an expert senior frontend engineer AI. Your task is to modify a web application based on a user's request.
- Analyze the user's request and the full project source code.
- Determine which files need to be created or updated.
- Respond with ONLY a valid JSON object.
- The JSON object must conform to the provided schema. It must be an array of objects, where each object has "file", "description", and "content" properties.
- For each modified file, you MUST provide the ENTIRE, complete new file content. Do not provide diffs or partial code.
- If a file does not need to be changed, do not include it in the response array.\`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        file: {
                            type: Type.STRING,
                            description: 'The full path of the file to be modified.',
                        },
                        description: {
                            type: Type.STRING,
                            description: 'A brief, one-sentence description of what you changed in this file.'
                        },
                        content: {
                            type: Type.STRING,
                            description: 'The complete, new content of the file.'
                        }
                    },
                    required: ["file", "description", "content"],
                }
            }
        },
    });
    
    try {
        const jsonText = response.text.trim();
        // The Gemini API sometimes wraps the JSON in markdown, so we need to clean it.
        const cleanedJson = jsonText.replace(/^\\\`\\\`\\\`json\\n/, '').replace(/\\n\\\`\\\`\\\`$/, '');
        const changes = JSON.parse(cleanedJson);
        return changes as FileChange[];
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", response.text);
        throw new Error("The AI returned an invalid response. Please try again.");
    }
};

export const generateComponentCode = async (prompt: string): Promise<{html: string, reasoning: string}> => {
    const model = getModel('gemini-2.5-pro');

    const response = await model.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            systemInstruction: \`You are an expert frontend developer specializing in React, TypeScript, and Tailwind CSS.
Your task is to generate a single, self-contained block of HTML/JSX code for a UI component based on the user's description.
- The component MUST be styled using Tailwind CSS classes.
- DO NOT include any imports, exports, or function definitions (like 'export const MyComponent = () => ...').
- Provide ONLY the raw JSX elements (e.g., '<div>...</div>').
- Use placeholder icons from a service like Heroicons (heroicons.com) as SVG elements if needed.
- Ensure the generated HTML is visually appealing and modern.
- You MUST respond with a valid JSON object. Do not add any markdown formatting like \`\`\`json.\`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    html: {
                        type: Type.STRING,
                        description: 'The raw HTML/JSX code for the component, styled with Tailwind CSS.'
                    },
                    reasoning: {
                        type: Type.STRING,
                        description: 'A brief explanation of the design choices and Tailwind classes used.'
                    }
                },
                required: ["html", "reasoning"]
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const cleanedJson = jsonText.replace(/^\\\`\\\`\\\`json\\n/, '').replace(/\\n\\\`\\\`\\\`$/, '');
        const result = JSON.parse(cleanedJson);
        return result as {html: string, reasoning: string};
    } catch (e) {
        console.error("Failed to parse JSON response from AI for component generation:", response.text);
        throw new Error("The AI returned an invalid response for the component generation. Please try again.");
    }
};`
};

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: React.ReactNode;
}

const CodeWizard: React.FC = () => {
    const [projectFiles, setProjectFiles] = useState(initialProjectFiles);
    const [selectedFile, setSelectedFile] = useState<string>('components/CodeWizard.tsx');
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

    const handleApply = useCallback(() => {
        if (!proposedChanges) return;
        
        const updatedFiles = { ...projectFiles };
        proposedChanges.forEach(change => {
            updatedFiles[change.file] = change.content;
        });

        setProjectFiles(updatedFiles);
        setProposedChanges(null);
        setUserRequest('');
        addMessage('model', `Applied ${proposedChanges.length} changes! ✨ What's next?`);
        setLastApplied(`Applied ${proposedChanges.length} changes!`);
        setTimeout(() => setLastApplied(''), 4000);
    }, [proposedChanges, projectFiles]);

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
            const fullRequest = `${request}${systemInstruction || ''}`;
            const changes = await generateProjectModifications(fullRequest, projectFiles);
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
                <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{__html: result.text.replace(/```(\w+)?\n/g, '<pre class="bg-gray-800 p-2 rounded-md my-2"><code class="language-$1">').replace(/```/g, '</code></pre>')}}></div>
            );
            
            if (!result.text.includes("magically pristine")) {
                 updateLastMessage(
                    <div>
                        {reportContent}
                        <button onClick={() => handleRequest('Please fix the bugs described in this report', `\n\nBug Report:\n${result.text}`)} className="mt-2 w-full px-4 py-2 bg-green-600 rounded-lg shadow-lg hover:bg-green-500 transition-colors text-sm">Attempt Auto-Fix</button>
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
            className="w-full h-full md:h-[85vh] flex flex-col bg-black/40 backdrop-blur-xl md:rounded-2xl border border-white/10 shadow-2xl p-2 md:p-4"
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