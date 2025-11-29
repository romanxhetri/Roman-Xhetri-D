import React, { useEffect, useRef, useState } from 'react';
import { NAV_ITEMS, View } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    JoystickIcon, OrbitIcon, GridIcon, ChatIcon, SearchIcon, MagicWandIcon, LiveIcon, 
    TtsIcon, TripPlannerIcon, StoryWeaverIcon, CodeWizardIcon, AetherCanvasIcon, 
    DataOracleIcon, ProductIcon, LaptopsIcon, PricingIcon, BlogIcon, GamesIcon, DreamWeaverIcon,
    CosmicComposerIcon, D20Icon, TemporalInvestigatorIcon, BioSymphonyIcon, EchoForgeIcon,
    MobileIcon, TroubleshooterIcon
} from './Icons';

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

type ViewMode = 'simulation' | 'orbit' | 'cards';

const PLANET_COLORS: { [key: string]: number } = {
    [View.PRODUCT]: 0x3b82f6,
    [View.PRICING]: 0x14b8a6,
    [View.BLOG]: 0xf97316,
    [View.FACEBOOK]: 0x3b82f6,
    [View.CHATGPT]: 0x8b5cf6,
    [View.LAPTOPS]: 0x64748b,
    [View.MOBILES]: 0x22c55e,
    [View.DEVICE_TROUBLESHOOTER]: 0x06b6d4,
    [View.AI_SEARCH]: 0x0ea5e9,
    [View.GAMES]: 0xef4444,
    [View.CHAT]: 0xec4899,
    [View.MEDIA_CREATION]: 0xd946ef,
    [View.LIVE_CONVERSATION]: 0xf59e0b,
    [View.TTS]: 0x10b981,
    [View.CODE_WIZARD]: 0x84cc16,
    [View.AETHER_CANVAS]: 0xf43f5e,
    [View.DATA_ORACLE]: 0x14b8a6,
    [View.TRIP_PLANNER]: 0x06b6d4,
    [View.STORY_WEAVER]: 0xfb923c,
    [View.DREAM_WEAVER]: 0x4c1d95,
    [View.COSMIC_COMPOSER]: 0x22d3ee,
    [View.MYTHOS_ENGINE]: 0xbe123c,
    [View.TEMPORAL_INVESTIGATOR]: 0xca8a04,
    [View.BIO_SYMPHONY]: 0xdb2777,
    [View.ECHO_FORGE]: 0x78716c,
};

const iconMap: Record<string, React.FC<{className?: string}>> = {
  [View.CHATGPT]: ChatIcon,
  [View.AI_SEARCH]: SearchIcon,
  [View.MEDIA_CREATION]: MagicWandIcon,
  [View.LIVE_CONVERSATION]: LiveIcon,
  [View.TTS]: TtsIcon,
  [View.TRIP_PLANNER]: TripPlannerIcon,
  [View.STORY_WEAVER]: StoryWeaverIcon,
  [View.DREAM_WEAVER]: DreamWeaverIcon,
  [View.COSMIC_COMPOSER]: CosmicComposerIcon,
  [View.MYTHOS_ENGINE]: D20Icon,
  [View.CODE_WIZARD]: CodeWizardIcon,
  [View.AETHER_CANVAS]: AetherCanvasIcon,
  [View.DATA_ORACLE]: DataOracleIcon,
  [View.PRODUCT]: ProductIcon,
  [View.LAPTOPS]: LaptopsIcon,
  [View.MOBILES]: MobileIcon,
  [View.DEVICE_TROUBLESHOOTER]: TroubleshooterIcon,
  [View.PRICING]: PricingIcon,
  [View.BLOG]: BlogIcon,
  [View.GAMES]: GamesIcon,
  [View.TEMPORAL_INVESTIGATOR]: TemporalInvestigatorIcon,
  [View.BIO_SYMPHONY]: BioSymphonyIcon,
  [View.ECHO_FORGE]: EchoForgeIcon,
};


export const SolarSystem: React.FC<SolarSystemProps> = ({ setActiveView }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('orbit');
    const [labels, setLabels] = useState<PlanetLabel[]>([]);
    const [nearbyPlanet, setNearbyPlanet] = useState<{ view: View; name: string } | null>(null);
    const [isInteracting, setIsInteracting] = useState(false);

    const stateRef = useRef({
        keyState: new Set<string>(),
        isDragging: false,
        previousMousePosition: { x: 0, y: 0 },
        // Touch state for mobile simulation
        touchStart: { x: 0, y: 0 },
        isTouchDragging: false,
        mobileMove: { forward: false, backward: false }
    });

    const clock = useRef<any>(null);

    useEffect(() => {
        const mountNode = mountRef.current;
        
        if (viewMode === 'cards' || !mountNode) {
            // Cleanup THREE.js instance if it exists
             if (mountNode && mountNode.firstChild) {
                mountNode.removeChild(mountNode.firstChild);
            }
            return;
        }

        if (!clock.current) {
            clock.current = new THREE.Clock();
        }

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, mountNode.clientWidth / mountNode.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
        // Optimize for performance on high DPI screens
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountNode.appendChild(renderer.domElement);

        camera.position.z = 30;
        camera.rotation.order = 'YXZ'; 

        scene.add(new THREE.AmbientLight(0x404040, 2));
        const sunLight = new THREE.PointLight(0xfffde8, 2.5, 200);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        const solarSystemGroup = new THREE.Group();
        scene.add(solarSystemGroup);

        const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
        const sunMaterial = new THREE.MeshStandardMaterial({
            emissive: 0xfffde8,
            emissiveIntensity: 1,
            color: 0xfffde8
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.userData.name = 'SageX';
        solarSystemGroup.add(sun);

        // Reduced star count for mobile performance
        const isMobile = window.innerWidth < 768;
        const starCount = isMobile ? 1500 : 5000;
        
        const starsGeometry = new THREE.BufferGeometry();
        const starsVertices = [];
        for (let i = 0; i < starCount; i++) {
            const x = THREE.MathUtils.randFloatSpread(2000);
            const y = THREE.MathUtils.randFloatSpread(2000);
            const z = THREE.MathUtils.randFloatSpread(2000);
            starsVertices.push(x, y, z);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0x888888, size: 0.1 });
        const starfield = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(starfield);

        const features = NAV_ITEMS.filter(item => item.view !== View.HOME);
        const planets: any[] = [];
        const planetLabelsData: Omit<PlanetLabel, 'x' | 'y' | 'isOccluded'>[] = [];

        features.forEach((feature, index) => {
            const planetGroup = new THREE.Group();
            const distanceFromSun = 8 + index * 2.5;
            const size = 0.5 + Math.random() * 0.5;

            // Simplify geometry slightly for performance
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

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        let eventListeners: { type: string, handler: EventListenerOrEventListenerObject, target: Document | HTMLElement }[] = [];

        const setupControls = () => {
            eventListeners.forEach(({ type, handler, target }) => target.removeEventListener(type, handler));
            eventListeners = [];
            
            const addListener = (type: string, handler: EventListenerOrEventListenerObject, target: Document | HTMLElement = mountNode) => {
                target.addEventListener(type, handler);
                eventListeners.push({ type, handler, target });
            };

            if (viewMode === 'simulation') {
                // Mouse look
                const onMouseMove = (event: MouseEvent) => {
                    if (document.pointerLockElement !== mountNode) return;
                    camera.rotation.y -= event.movementX * 0.002;
                    camera.rotation.x -= event.movementY * 0.002;
                    camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
                };

                // Touch look for mobile
                const onTouchStart = (event: TouchEvent) => {
                    if (event.touches.length === 1) {
                         stateRef.current.touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
                         stateRef.current.isTouchDragging = true;
                    }
                };
                
                const onTouchMove = (event: TouchEvent) => {
                    if (stateRef.current.isTouchDragging && event.touches.length === 1) {
                        const deltaX = event.touches[0].clientX - stateRef.current.touchStart.x;
                        const deltaY = event.touches[0].clientY - stateRef.current.touchStart.y;
                        
                        camera.rotation.y -= deltaX * 0.005;
                        camera.rotation.x -= deltaY * 0.005;
                        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
                        
                        stateRef.current.touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
                    }
                };

                 const onTouchEnd = () => {
                     stateRef.current.isTouchDragging = false;
                 };

                const onKeyDown = (event: KeyboardEvent) => {
                    stateRef.current.keyState.add(event.key.toLowerCase());
                    if (event.key.toLowerCase() === 'e' && nearbyPlanet) {
                        setIsInteracting(true);
                        setActiveView(nearbyPlanet.view as View);
                    }
                };
                const onKeyUp = (event: KeyboardEvent) => stateRef.current.keyState.delete(event.key.toLowerCase());
                const onClickToLock = () => {
                    // Only request pointer lock on non-touch devices to avoid messing up touch controls
                    if (!('ontouchstart' in window)) {
                         mountNode.requestPointerLock();
                    }
                };

                addListener('mousemove', onMouseMove as EventListener, document);
                addListener('keydown', onKeyDown as EventListener, document);
                addListener('keyup', onKeyUp as EventListener, document);
                addListener('click', onClickToLock as EventListener);
                addListener('touchstart', onTouchStart as EventListener);
                addListener('touchmove', onTouchMove as EventListener);
                addListener('touchend', onTouchEnd as EventListener);

            } else { // Orbit Mode
                const onMouseDown = (event: MouseEvent) => {
                    stateRef.current.isDragging = true;
                    stateRef.current.previousMousePosition = { x: event.clientX, y: event.clientY };
                };
                const onMouseMove = (event: MouseEvent) => {
                    if (!stateRef.current.isDragging) return;
                    const deltaX = event.clientX - stateRef.current.previousMousePosition.x;
                    const deltaY = event.clientY - stateRef.current.previousMousePosition.y;
                    solarSystemGroup.rotation.y += deltaX * 0.005;
                    solarSystemGroup.rotation.x += deltaY * 0.005;
                    solarSystemGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, solarSystemGroup.rotation.x));
                    stateRef.current.previousMousePosition = { x: event.clientX, y: event.clientY };
                };
                const onMouseUp = () => stateRef.current.isDragging = false;
                
                // Touch Orbit
                const onTouchStart = (event: TouchEvent) => {
                    if (event.touches.length === 1) {
                         stateRef.current.isDragging = true;
                         stateRef.current.previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
                    }
                };
                
                 const onTouchMove = (event: TouchEvent) => {
                    if (stateRef.current.isDragging && event.touches.length === 1) {
                        const deltaX = event.touches[0].clientX - stateRef.current.previousMousePosition.x;
                        const deltaY = event.touches[0].clientY - stateRef.current.previousMousePosition.y;
                        solarSystemGroup.rotation.y += deltaX * 0.005;
                        solarSystemGroup.rotation.x += deltaY * 0.005;
                        solarSystemGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, solarSystemGroup.rotation.x));
                        stateRef.current.previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
                    }
                 };


                const onWheel = (event: WheelEvent) => {
                    camera.position.z += event.deltaY * 0.01;
                    camera.position.z = Math.max(15, Math.min(70, camera.position.z));
                };
                 const onClickPlanet = (event: MouseEvent) => {
                    if (stateRef.current.isDragging) return;
                    mouse.x = (event.clientX / mountNode.clientWidth) * 2 - 1;
                    mouse.y = -(event.clientY / mountNode.clientHeight) * 2 + 1;
                    raycaster.setFromCamera(mouse, camera);
                    const intersects = raycaster.intersectObjects(planets);
                    if (intersects.length > 0) {
                        const targetPlanet = intersects[0].object;
                        const targetView = targetPlanet.userData.view;
                        setIsInteracting(true);
                        const targetPosition = new THREE.Vector3();
                        targetPlanet.getWorldPosition(targetPosition);
                        const direction = new THREE.Vector3().subVectors(camera.position, targetPosition).normalize();
                        const finalPosition = new THREE.Vector3().addVectors(targetPosition, direction.multiplyScalar(5));
                        new TWEEN.Tween(camera.position)
                            .to(finalPosition, 1000)
                            .easing(TWEEN.Easing.Quadratic.InOut)
                            .onComplete(() => setActiveView(targetView as View))
                            .start();
                    }
                };
                addListener('mousedown', onMouseDown as EventListener);
                addListener('mousemove', onMouseMove as EventListener);
                addListener('mouseup', onMouseUp as EventListener);
                addListener('touchstart', onTouchStart as EventListener);
                addListener('touchmove', onTouchMove as EventListener);
                addListener('touchend', onMouseUp as EventListener); // Reuse mouse up logic
                addListener('wheel', onWheel as EventListener);
                addListener('click', onClickPlanet as EventListener);
            }
        };

        setupControls();

        const animate = (time: number) => {
            TWEEN.update(time);
            const deltaTime = clock.current.getDelta();

            if (viewMode === 'simulation') {
                const moveSpeed = 15.0;
                // Keyboard controls
                if (stateRef.current.keyState.has('w')) camera.translateZ(-moveSpeed * deltaTime);
                if (stateRef.current.keyState.has('s')) camera.translateZ(moveSpeed * deltaTime);
                if (stateRef.current.keyState.has('a')) camera.translateX(-moveSpeed * deltaTime);
                if (stateRef.current.keyState.has('d')) camera.translateX(moveSpeed * deltaTime);
                
                // Mobile controls
                if (stateRef.current.mobileMove.forward) camera.translateZ(-moveSpeed * deltaTime);
                if (stateRef.current.mobileMove.backward) camera.translateZ(moveSpeed * deltaTime);
            }

            let closestDist = Infinity;
            let closestPlanet = null;

            solarSystemGroup.children.forEach(child => {
                if (child.userData.rotationSpeed) {
                    child.rotation.y += child.userData.rotationSpeed;
                }
            });

            const newLabels = planetLabelsData.map(labelData => {
                const planet = planets.find(p => p.userData.view === labelData.id);
                if (!planet) return null;

                const worldPosition = new THREE.Vector3();
                planet.getWorldPosition(worldPosition);

                const distanceToCamera = camera.position.distanceTo(worldPosition);
                if (viewMode === 'simulation' && distanceToCamera < closestDist) {
                    closestDist = distanceToCamera;
                    closestPlanet = { view: planet.userData.view, name: planet.userData.name };
                }

                const screenPosition = worldPosition.clone().project(camera);
                const isOccluded = screenPosition.z > 1;

                return {
                    ...labelData,
                    x: (screenPosition.x * 0.5 + 0.5) * mountNode.clientWidth,
                    y: (-screenPosition.y * 0.5 + 0.5) * mountNode.clientHeight,
                    isOccluded
                };
            }).filter(Boolean) as PlanetLabel[];
            
            setLabels(newLabels);

            if (viewMode === 'simulation') {
                setNearbyPlanet(closestDist < 5 ? closestPlanet : null);
            }
            
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        animate(0);

        const handleResize = () => {
            camera.aspect = mountNode.clientWidth / mountNode.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountNode && mountNode.firstChild) {
                mountNode.removeChild(mountNode.firstChild);
            }
            eventListeners.forEach(({ type, handler, target }) => target.removeEventListener(type, handler));
        };
    }, [viewMode]);

    return (
        <div className="w-full h-full relative">
            <div ref={mountRef} className="w-full h-full absolute inset-0" />
             <AnimatePresence>
                {isInteracting && (
                    <motion.div 
                        className="absolute inset-0 bg-black/80 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                    </motion.div>
                )}
            </AnimatePresence>

             {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <AnimatePresence>
                    {viewMode === 'cards' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4 overflow-y-auto pointer-events-auto"
                        >
                            {NAV_ITEMS.filter(i => i.view !== View.HOME).map((item, idx) => {
                                const Icon = iconMap[item.view] || ChatIcon;
                                return (
                                    <motion.div
                                        key={item.view}
                                        className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-purple-500/20 transition-colors"
                                        onClick={() => setActiveView(item.view as View)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <div className="p-3 bg-purple-500/10 rounded-full mb-3">
                                            <Icon className="h-8 w-8 text-purple-300" />
                                        </div>
                                        <h3 className="font-bold">{item.label}</h3>
                                        <p className="text-xs text-gray-400">{item.description}</p>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {viewMode !== 'cards' && labels.map(label => (
                    !label.isOccluded && (
                        <motion.div
                            key={label.id}
                            className="absolute bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded pointer-events-auto cursor-pointer"
                            style={{
                                left: label.x,
                                top: label.y,
                                transform: 'translate(-50%, -50%)'
                            }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setActiveView(label.id as View)}
                        >
                            {label.name}
                        </motion.div>
                    )
                ))}
                 {viewMode === 'simulation' && (
                    <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 text-white text-2xl">+</div>
                )}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/10 pointer-events-auto">
                    <button onClick={() => setViewMode('simulation')} className={`p-2 rounded-md transition-colors ${viewMode === 'simulation' ? 'bg-purple-600' : 'hover:bg-white/10'}`} title="First-Person View"><JoystickIcon /></button>
                    <button onClick={() => setViewMode('orbit')} className={`p-2 rounded-md transition-colors ${viewMode === 'orbit' ? 'bg-purple-600' : 'hover:bg-white/10'}`} title="Orbit View"><OrbitIcon /></button>
                    <button onClick={() => setViewMode('cards')} className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-purple-600' : 'hover:bg-white/10'}`} title="Grid View"><GridIcon /></button>
                </div>

                {/* Mobile Simulation Controls */}
                {viewMode === 'simulation' && (
                    <div className="absolute bottom-20 right-4 flex flex-col gap-4 pointer-events-auto md:hidden">
                        <button 
                            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:bg-purple-500/50"
                            onTouchStart={(e) => { e.preventDefault(); stateRef.current.mobileMove.forward = true; }}
                            onTouchEnd={(e) => { e.preventDefault(); stateRef.current.mobileMove.forward = false; }}
                        >
                            ▲
                        </button>
                         <button 
                            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:bg-purple-500/50"
                            onTouchStart={(e) => { e.preventDefault(); stateRef.current.mobileMove.backward = true; }}
                            onTouchEnd={(e) => { e.preventDefault(); stateRef.current.mobileMove.backward = false; }}
                        >
                            ▼
                        </button>
                    </div>
                )}

                <AnimatePresence>
                {viewMode === 'simulation' && nearbyPlanet && (
                    <motion.div
                        className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg text-center"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <p className="hidden md:block">Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">E</kbd> to enter</p>
                        <button 
                            className="md:hidden mt-1 px-4 py-2 bg-purple-600 rounded-lg pointer-events-auto"
                            onClick={() => {
                                setIsInteracting(true);
                                setActiveView(nearbyPlanet.view as View);
                            }}
                        >
                            Tap to Enter
                        </button>
                        <p className="font-bold text-lg mt-1">{nearbyPlanet.name}</p>
                    </motion.div>
                )}
                </AnimatePresence>

                 <AnimatePresence>
                {viewMode === 'simulation' && (
                    <motion.div
                        className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10 text-sm hidden md:block"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <h3 className="font-bold">Controls</h3>
                        <p><kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 rounded">W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> - Move</p>
                        <p>Mouse - Look</p>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};