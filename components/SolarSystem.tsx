import React, { useEffect, useRef, useState } from 'react';
import { NAV_ITEMS, View } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { JoystickIcon, OrbitIcon } from './Icons';

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
    [View.DATA_ORACLE]: 0x14b8a6, // teal-500
};


const SolarSystem: React.FC<SolarSystemProps> = ({ setActiveView }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isSimulationMode, setSimulationMode] = useState(true);
    const [labels, setLabels] = useState<PlanetLabel[]>([]);
    const [nearbyPlanet, setNearbyPlanet] = useState<{ view: View; name: string } | null>(null);
    const [isInteracting, setIsInteracting] = useState(false);

    const stateRef = useRef({
        keyState: new Set<string>(),
        isDragging: false,
        previousMousePosition: { x: 0, y: 0 },
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
        for (let i = 0; i < 5000; i++) {
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

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        // --- CONTROLS ---
        let eventListeners: { type: string, handler: EventListenerOrEventListenerObject }[] = [];

        const setupControls = () => {
             // Clear previous listeners
            eventListeners.forEach(({ type, handler }) => mountNode.removeEventListener(type, handler));
            eventListeners = [];
            
            const addListener = (type: string, handler: EventListenerOrEventListenerObject) => {
                mountNode.addEventListener(type, handler);
                eventListeners.push({ type, handler });
            };

            if (isSimulationMode) {
                 // --- SIMULATION MODE ---
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
                const onKeyUp = (event: KeyboardEvent) => stateRef.current.keyState.delete(event.key.toLowerCase());
                const onClickToLock = () => mountNode.requestPointerLock();

                document.addEventListener('mousemove', onMouseMove as EventListener);
                document.addEventListener('keydown', onKeyDown as EventListener);
                document.addEventListener('keyup', onKeyUp as EventListener);
                addListener('click', onClickToLock as EventListener);
                eventListeners.push(
                    { type: 'mousemove', handler: onMouseMove as EventListener },
                    { type: 'keydown', handler: onKeyDown as EventListener },
                    { type: 'keyup', handler: onKeyUp as EventListener }
                );

            } else {
                 // --- ORBIT MODE ---
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
                addListener('wheel', onWheel as EventListener);
                addListener('click', onClickPlanet as EventListener);
            }
        };

        setupControls();

        // Animation loop
        const animate = (time: number) => {
            TWEEN.update(time);
            const deltaTime = clock.current.getDelta();

            if (isSimulationMode) {
                const moveSpeed = 15.0;
                if (stateRef.current.keyState.has('w')) camera.translateZ(-moveSpeed * deltaTime);
                if (stateRef.current.keyState.has('s')) camera.translateZ(moveSpeed * deltaTime);
                if (stateRef.current.keyState.has('a')) camera.translateX(-moveSpeed * deltaTime);
                if (stateRef.current.keyState.has('d')) camera.translateX(moveSpeed * deltaTime);
                if (stateRef.current.keyState.has(' ')) camera.position.y += moveSpeed * deltaTime;
                if (stateRef.current.keyState.has('shift')) camera.position.y -= moveSpeed * deltaTime;
            }

            solarSystemGroup.children.forEach(child => {
                 if (child instanceof THREE.Group && child.userData.rotationSpeed) {
                    child.rotation.y += child.userData.rotationSpeed;
                 }
            });
            
            const newLabels: PlanetLabel[] = [];
            let closestPlanet = null;
            if (isSimulationMode) {
                let minDistance = 5;
                planets.forEach(planet => {
                    const vector = new THREE.Vector3();
                    planet.getWorldPosition(vector);
                    const distance = camera.position.distanceTo(vector);
                    if(distance < minDistance) {
                        minDistance = distance;
                        closestPlanet = planet.userData;
                    }
                });
            }
            setNearbyPlanet(closestPlanet);

            planets.forEach((planet, i) => {
                const vector = new THREE.Vector3();
                planet.getWorldPosition(vector);
                
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
            // This is a bit of a workaround to clean up document listeners
            eventListeners.forEach(({ type, handler }) => {
                if (type === 'click' || type === 'mousedown' || type === 'mouseup' || type === 'wheel') {
                    mountNode.removeEventListener(type, handler);
                } else {
                    document.removeEventListener(type, handler);
                }
            });
            mountNode.removeChild(renderer.domElement);
        };
    }, [setActiveView, isSimulationMode]); // Rerun effect when mode changes

    return (
        <div className={`w-full h-full relative ${isSimulationMode ? 'cursor-crosshair' : 'cursor-grab'}`}>
             <div ref={mountRef} className="w-full h-full" />

             <button 
                onClick={() => setSimulationMode(prev => !prev)}
                className="absolute top-24 right-4 z-50 p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-purple-500/50 transition-all"
                title={isSimulationMode ? "Switch to Orbit Mode" : "Switch to Simulation Mode"}
             >
                {isSimulationMode ? <OrbitIcon /> : <JoystickIcon />}
             </button>

             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none p-4 w-full">
                 <motion.div initial={{opacity: 0}} animate={{opacity: isInteracting ? 0 : 1}} transition={{duration: 0.5}}>
                    <h1 className="text-4xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                        SageX AI Universe
                    </h1>
                    {isSimulationMode ? (
                        <>
                         <p className="text-gray-300 mt-2 text-sm md:text-base">Click to start, then use WASD to move and Mouse to look.</p>
                         <p className="text-xs text-gray-500 mt-1">(Press 'Esc' to release mouse control)</p>
                        </>
                    ) : (
                         <p className="text-gray-300 mt-2 text-sm md:text-base">Click & Drag to rotate. Click a planet to explore.</p>
                    )}
                 </motion.div>
             </div>
             {labels.map(label => (
                 <motion.div
                     key={label.id}
                     className={`absolute p-2 text-xs bg-black/50 text-white rounded-md pointer-events-none ${!isSimulationMode ? 'cursor-pointer hover:ring-2 ring-purple-400' : ''}`}
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
                {nearbyPlanet && isSimulationMode && !isInteracting && (
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

export default SolarSystem;