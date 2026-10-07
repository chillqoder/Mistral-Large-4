import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createAquarium, setRenderer } from './aquarium.js';
import { createWater, updateWater } from './water.js';
import { createFilter, createBubbleSystem, updateBubbles } from './filter.js';
import { createPebbleBed, getSubstrateHeight } from './pebbles.js';
import { createCastle } from './castle.js';
import { createAllPlants, updatePlants } from './plants.js';
import { createAllFish } from './fish.js';
import { initFishAIForAll } from './fishAI.js';
import { createCrab } from './crab.js';
import { createAllSnails, updateSnails } from './snails.js';
import { createLightingEffects } from './lighting.js';

// ============================================
// CORE SETUP
// ============================================

const container = document.getElementById('canvas-container');

window.aquariumStage = 'Creating WebGL renderer';
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Deep navy-to-teal studio background
const bgColor1 = new THREE.Color(0x0a1628);
const bgColor2 = new THREE.Color(0x0d3b4f);
scene.background = bgColor1;
scene.fog = new THREE.FogExp2(0x0a1628, 0.015);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
// Slightly elevated three-quarter front view - framed to show full tank
camera.position.set(11, 7.5, 13);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 2.2, 0);

// Prevent camera from entering the tank
controls.minDistance = 7;
controls.maxDistance = 35;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minPolarAngle = 0.05;
controls.enablePan = true;
controls.panSpeed = 0.5;
controls.zoomSpeed = 0.8;
controls.rotateSpeed = 0.6;

// ============================================
// LIGHTING
// ============================================

// Ambient fill
const ambientLight = new THREE.AmbientLight(0x4a6a8a, 0.3);
scene.add(ambientLight);

// Key light (aquarium light from above)
const keyLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
keyLight.position.set(0, 15, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 50;
// Tight shadow camera bounds for better quality
keyLight.shadow.camera.left = -6;
keyLight.shadow.camera.right = 6;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -6;
keyLight.shadow.bias = -0.0005;
keyLight.shadow.normalBias = 0.02;
scene.add(keyLight);

// Cool fill light
const fillLight = new THREE.DirectionalLight(0x6a9ecf, 0.4);
fillLight.position.set(-5, 5, -8);
scene.add(fillLight);

// Rim light for glass highlights
const rimLight = new THREE.DirectionalLight(0x88ccff, 0.3);
rimLight.position.set(8, 3, -5);
scene.add(rimLight);

// ============================================
// TANK DIMENSIONS (Stage 1)
// ============================================
// Tank: 8 wide × 4 deep × 5 high, bottom near Y=0, waterline near Y=4.55
const TANK = {
    width: 8,
    depth: 4,
    height: 5,
    waterLevel: 4.55,
    glassThickness: 0.15
};

// ============================================
// BUILD THE AQUARIUM (Stage 1)
// ============================================
window.aquariumStage = 'Glass and environment';
setRenderer(renderer);
createAquarium(scene, TANK);

// ============================================
// BUILD THE WATER (Stage 2)
// ============================================
window.aquariumStage = 'Water';
const waterSystem = createWater(scene, TANK);

// ============================================
// BUILD THE BUBBLE FILTER (Stage 3)
// ============================================
window.aquariumStage = 'Filter';
const filterData = createFilter(scene, TANK);
const bubbleSystem = createBubbleSystem(scene, TANK, filterData.outletPos);

// ============================================
// BUILD THE PEBBLE BED (Stage 4)
// ============================================
window.aquariumStage = 'Substrate';
const pebbleBed = createPebbleBed(scene, TANK);

// ============================================
// BUILD THE CASTLE (Stage 5)
// ============================================
window.aquariumStage = 'Castle';
const castle = createCastle(scene, TANK);

// ============================================
// BUILD THE PLANTS (Stage 6)
// ============================================
window.aquariumStage = 'Plants';
const plants = createAllPlants(scene, TANK);

// ============================================
// BUILD THE FISH (Stages 7-10)
// ============================================
window.aquariumStage = 'Fish';
const fishes = createAllFish(scene);

// ============================================
// INITIALIZE FISH AI (Stage 11)
// ============================================
window.aquariumStage = 'Fish behavior';
const fishAI = initFishAIForAll(fishes, TANK, castle, filterData, plants);

// ============================================
// BUILD THE CRAB (Stage 12)
// ============================================
window.aquariumStage = 'Crab';
const crab = createCrab(scene, TANK);

// ============================================
// BUILD THE SNAILS (Stage 13)
// ============================================
window.aquariumStage = 'Snails';
const snails = createAllSnails(scene, TANK);

// ============================================
// LIGHTING, CAUSTICS, PARTICLES (Stage 14)
// ============================================
window.aquariumStage = 'Lighting';
const lightingEffects = createLightingEffects(scene, TANK);

// ============================================
// RESIZE HANDLER
// ============================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================
// ANIMATION LOOP
// ============================================
const clock = new THREE.Clock();
let isPaused = false;

// FPS tracking
const fpsCounter = document.getElementById('fps-counter');
let frameCount = 0;
let lastFpsTime = performance.now();
let currentFps = 60;

// Adaptive quality settings
const qualitySettings = {
    targetFps: 55,
    minPixelRatio: 1,
    currentPixelRatio: Math.min(window.devicePixelRatio, 2),
    shadowMapSize: 2048,
    adjustmentCooldown: 0
};

function updateFps() {
    frameCount++;
    const now = performance.now();
    const elapsed = now - lastFpsTime;
    
    if (elapsed >= 1000) {
        currentFps = Math.round((frameCount * 1000) / elapsed);
        fpsCounter.textContent = `${currentFps} fps`;
        fpsCounter.style.opacity = currentFps >= 55 ? '0.5' : currentFps >= 30 ? '0.8' : '1';
        fpsCounter.style.color = currentFps >= 55 ? 'white' : currentFps >= 30 ? 'orange' : 'red';
        
        frameCount = 0;
        lastFpsTime = now;
        
        // Adaptive quality adjustment
        qualitySettings.adjustmentCooldown--;
        if (qualitySettings.adjustmentCooldown <= 0) {
            if (currentFps < qualitySettings.targetFps - 5 && qualitySettings.currentPixelRatio > qualitySettings.minPixelRatio) {
                // Reduce pixel ratio
                qualitySettings.currentPixelRatio = Math.max(
                    qualitySettings.minPixelRatio, 
                    qualitySettings.currentPixelRatio - 0.25
                );
                renderer.setPixelRatio(qualitySettings.currentPixelRatio);
                qualitySettings.adjustmentCooldown = 5; // wait 5 seconds before next adjustment
            } else if (currentFps > qualitySettings.targetFps + 10 && qualitySettings.currentPixelRatio < Math.min(window.devicePixelRatio, 2)) {
                // Increase pixel ratio
                qualitySettings.currentPixelRatio = Math.min(
                    Math.min(window.devicePixelRatio, 2), 
                    qualitySettings.currentPixelRatio + 0.25
                );
                renderer.setPixelRatio(qualitySettings.currentPixelRatio);
                qualitySettings.adjustmentCooldown = 5;
            }
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.elapsedTime;
    
    if (!isPaused) {
        // Update all systems
        updateWater(waterSystem, delta, elapsed);
        updateBubbles(bubbleSystem, delta, elapsed, TANK, waterSystem);
        updatePlants(plants, delta, elapsed, filterData.outletPos);
        fishAI.update(delta, elapsed);
        crab.update(delta, elapsed);
        updateSnails(snails, delta, elapsed);
        lightingEffects.update(delta, elapsed, filterData.outletPos);
    }
    
    controls.update();
    window.aquariumStage = 'Rendering frame';
    renderer.render(scene, camera);
    
    updateFps();
}

// ============================================
// UI CONTROLS
// ============================================
const pauseBtn = document.getElementById('pause-btn');
pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
});

document.getElementById('reset-view').addEventListener('click', () => {
    camera.position.set(11, 7.5, 13);
    controls.target.set(0, 2.2, 0);
    controls.update();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    } else if (e.code === 'KeyR') {
        camera.position.set(11, 7.5, 13);
        controls.target.set(0, 2.2, 0);
        controls.update();
    }
});

// Hide loading
setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
    
    // Startup validation
    console.log('🌊 Living Glass Aquarium initialized');
    console.log(`Scene objects: ${scene.children.length}`);
    console.log(`Fish: ${fishes.length} (${fishes.map(f => f.species).join(', ')})`);
    console.log(`Plants: ${plants.length} (${plants.map(p => p.type).join(', ')})`);
    console.log(`Snails: ${snails.length} (${snails.map(s => s.type).join(', ')})`);
    console.log('Controls: Drag=orbit, Scroll=zoom, Right-drag=pan, Space=pause, R=reset');
}, 500);

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Aquarium error:', e.error);
    const loading = document.getElementById('loading');
    if (loading) {
        loading.textContent = 'Error loading aquarium. Check console for details.';
        loading.style.color = '#ff6666';
    }
});

// Start
animate();

// Export for other modules (will be expanded)
export { scene, camera, renderer, controls, TANK, THREE };
